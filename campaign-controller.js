const Campaign = require('../models/Campaign');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

// Multer config for banner upload
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('فقط فایل‌های تصویری مجاز هستند', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

exports.uploadCampaignBanners = upload.fields([
  { name: 'desktop', maxCount: 1 },
  { name: 'mobile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

exports.resizeCampaignBanners = catchAsync(async (req, res, next) => {
  if (!req.files) return next();
  
  const campaignId = req.params.id || Date.now();
  
  // Process desktop banner
  if (req.files.desktop) {
    const filename = `campaign-desktop-${campaignId}-${Date.now()}.jpeg`;
    await sharp(req.files.desktop[0].buffer)
      .resize(1920, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 85 })
      .toFile(`public/images/campaigns/${filename}`);
    
    req.body.banners = req.body.banners || {};
    req.body.banners.desktop = `/images/campaigns/${filename}`;
  }
  
  // Process mobile banner
  if (req.files.mobile) {
    const filename = `campaign-mobile-${campaignId}-${Date.now()}.jpeg`;
    await sharp(req.files.mobile[0].buffer)
      .resize(768, 400)
      .toFormat('jpeg')
      .jpeg({ quality: 85 })
      .toFile(`public/images/campaigns/${filename}`);
    
    req.body.banners = req.body.banners || {};
    req.body.banners.mobile = `/images/campaigns/${filename}`;
  }
  
  // Process thumbnail
  if (req.files.thumbnail) {
    const filename = `campaign-thumb-${campaignId}-${Date.now()}.jpeg`;
    await sharp(req.files.thumbnail[0].buffer)
      .resize(400, 300)
      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toFile(`public/images/campaigns/${filename}`);
    
    req.body.banners = req.body.banners || {};
    req.body.banners.thumbnail = `/images/campaigns/${filename}`;
  }
  
  next();
});

// Get all campaigns (admin)
exports.getAllCampaigns = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, type } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  
  const campaigns = await Campaign.find(query)
    .populate('createdBy', 'name')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Campaign.countDocuments(query);
  
  res.status(200).json({
    success: true,
    results: campaigns.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    campaigns
  });
});

// Get active campaigns
exports.getActiveCampaigns = catchAsync(async (req, res, next) => {
  const campaigns = await Campaign.getActiveCampaigns();
  
  // Update view count
  for (const campaign of campaigns) {
    await campaign.updateAnalytics('views');
  }
  
  res.status(200).json({
    success: true,
    results: campaigns.length,
    campaigns
  });
});

// Get single campaign
exports.getCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('products.includedProducts', 'name price images rating')
    .populate('products.categories', 'name slug')
    .populate('createdBy', 'name');
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  // Update view count if active
  if (campaign.isActive) {
    await campaign.updateAnalytics('views');
  }
  
  res.status(200).json({
    success: true,
    campaign
  });
});

// Get campaign by slug
exports.getCampaignBySlug = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findOne({ slug: req.params.slug })
    .populate({
      path: 'products.includedProducts',
      select: 'name price discount images rating stock category',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  if (!campaign.isActive) {
    return next(new AppError('این کمپین در حال حاضر فعال نیست', 400));
  }
  
  // Update analytics
  await campaign.updateAnalytics('views');
  await campaign.updateAnalytics('clicks');
  
  res.status(200).json({
    success: true,
    campaign
  });
});

// Create campaign
exports.createCampaign = catchAsync(async (req, res, next) => {
  const campaignData = {
    ...req.body,
    createdBy: req.user.id
  };
  
  // Parse arrays if sent as strings
  if (typeof campaignData.products?.includedProducts === 'string') {
    campaignData.products.includedProducts = JSON.parse(campaignData.products.includedProducts);
  }
  if (typeof campaignData.products?.categories === 'string') {
    campaignData.products.categories = JSON.parse(campaignData.products.categories);
  }
  
  const campaign = await Campaign.create(campaignData);
  
  res.status(201).json({
    success: true,
    message: 'کمپین با موفقیت ایجاد شد',
    campaign
  });
});

// Update campaign
exports.updateCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  // Don't allow updating active campaigns except for pausing
  if (campaign.status === 'active' && req.body.status !== 'paused' && !req.body.endDate) {
    return next(new AppError('کمپین فعال را نمی‌توان ویرایش کرد', 400));
  }
  
  // Update fields
  const allowedFields = [
    'name', 'description', 'rules', 'targetAudience', 
    'products', 'priority', 'status', 'endDate', 'banners'
  ];
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      campaign[field] = req.body[field];
    }
  });
  
  await campaign.save();
  
  res.status(200).json({
    success: true,
    message: 'کمپین با موفقیت بروزرسانی شد',
    campaign
  });
});

// Delete campaign
exports.deleteCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  if (campaign.status === 'active') {
    return next(new AppError('کمپین فعال را نمی‌توان حذف کرد', 400));
  }
  
  await campaign.remove();
  
  res.status(204).json({
    success: true,
    message: 'کمپین با موفقیت حذف شد'
  });
});

// Activate campaign
exports.activateCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  if (campaign.status === 'active') {
    return next(new AppError('کمپین در حال حاضر فعال است', 400));
  }
  
  // Check if campaign dates are valid
  const now = new Date();
  if (now < campaign.startDate) {
    campaign.status = 'scheduled';
  } else if (now > campaign.endDate) {
    return next(new AppError('کمپین منقضی شده است', 400));
  } else {
    await campaign.activate();
  }
  
  res.status(200).json({
    success: true,
    message: 'کمپین با موفقیت فعال شد',
    campaign
  });
});

// Pause campaign
exports.pauseCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  if (campaign.status !== 'active') {
    return next(new AppError('فقط کمپین‌های فعال را می‌توان متوقف کرد', 400));
  }
  
  await campaign.pause();
  
  res.status(200).json({
    success: true,
    message: 'کمپین با موفقیت متوقف شد',
    campaign
  });
});

// End campaign
exports.endCampaign = catchAsync(async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  if (campaign.status === 'ended') {
    return next(new AppError('کمپین قبلا پایان یافته است', 400));
  }
  
  await campaign.end();
  
  res.status(200).json({
    success: true,
    message: 'کمپین با موفقیت پایان یافت',
    campaign
  });
});

// Get campaign products
exports.getCampaignProducts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
  
  const campaign = await Campaign.findById(req.params.id);
  
  if (!campaign) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  if (!campaign.isActive) {
    return next(new AppError('کمپین فعال نیست', 400));
  }
  
  let query = { status: 'active' };
  
  // Build product query based on campaign settings
  if (campaign.products.includeAll) {
    // Exclude specific products
    if (campaign.products.excludedProducts.length > 0) {
      query._id = { $nin: campaign.products.excludedProducts };
    }
  } else {
    // Include specific products or categories
    const conditions = [];
    
    if (campaign.products.includedProducts.length > 0) {
      conditions.push({ _id: { $in: campaign.products.includedProducts } });
    }
    
    if (campaign.products.categories.length > 0) {
      conditions.push({ category: { $in: campaign.products.categories } });
    }
    
    if (campaign.products.brands.length > 0) {
      conditions.push({ brand: { $in: campaign.products.brands } });
    }
    
    if (conditions.length > 0) {
      query.$or = conditions;
    } else {
      // No products match
      return res.status(200).json({
        success: true,
        results: 0,
        products: []
      });
    }
    
    // Still exclude specific products
    if (campaign.products.excludedProducts.length > 0) {
      query._id = { $nin: campaign.products.excludedProducts };
    }
  }
  
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Product.countDocuments(query);
  
  // Add campaign discount info to products
  const productsWithCampaign = products.map(product => {
    const productObj = product.toObject();
    productObj.campaignDiscount = {
      type: campaign.rules.discountType,
      value: campaign.rules.discountValue,
      campaignName: campaign.name,
      campaignSlug: campaign.slug
    };
    return productObj;
  });
  
  res.status(200).json({
    success: true,
    campaign: {
      id: campaign._id,
      name: campaign.name,
      slug: campaign.slug,
      type: campaign.type,
      remainingTime: campaign.remainingTime
    },
    results: products.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    products: productsWithCampaign
  });
});

// Get campaign performance
exports.getCampaignPerformance = catchAsync(async (req, res, next) => {
  const performance = await Campaign.getCampaignPerformance(req.params.id);
  
  if (!performance) {
    return next(new AppError('کمپین یافت نشد', 404));
  }
  
  res.status(200).json({
    success: true,
    performance
  });
});

// Apply campaigns to cart (internal use)
exports.applyCartCampaigns = catchAsync(async (req, res, next) => {
  const { items, subtotal } = req.body;
  
  if (!req.user) {
    return res.status(200).json({
      success: true,
      campaigns: [],
      totalDiscount: 0
    });
  }
  
  // Get applicable campaigns
  const campaigns = await Campaign.getApplicableCampaigns(req.user.id, items);
  
  let totalDiscount = 0;
  const appliedCampaigns = [];
  
  for (const campaign of campaigns) {
    const discount = campaign.calculateDiscount(items, subtotal - totalDiscount);
    
    if (discount > 0) {
      appliedCampaigns.push({
        id: campaign._id,
        name: campaign.name,
        type: campaign.type,
        discount
      });
      
      totalDiscount += discount;
      
      // If not stackable, stop after first campaign
      if (!campaign.isStackable) {
        break;
      }
    }
  }
  
  res.status(200).json({
    success: true,
    campaigns: appliedCampaigns,
    totalDiscount
  });
});

// Get user applicable campaigns
exports.getUserCampaigns = catchAsync(async (req, res, next) => {
  const campaigns = await Campaign.getActiveCampaigns();
  const applicableCampaigns = [];
  
  for (const campaign of campaigns) {
    const isEligible = await campaign.isUserEligible(req.user.id);
    if (isEligible) {
      applicableCampaigns.push({
        id: campaign._id,
        name: campaign.name,
        description: campaign.description,
        type: campaign.type,
        banners: campaign.banners,
        remainingTime: campaign.remainingTime,
        requiresCoupon: campaign.requiresCoupon,
        couponCode: campaign.requiresCoupon ? campaign.couponCode : undefined
      });
    }
  }
  
  res.status(200).json({
    success: true,
    results: applicableCampaigns.length,
    campaigns: applicableCampaigns
  });
});