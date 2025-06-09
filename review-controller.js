const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

// Multer config for image upload
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

exports.uploadReviewImages = upload.array('images', 5);

exports.resizeReviewImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();
  
  req.body.images = [];
  
  await Promise.all(
    req.files.map(async (file, i) => {
      const filename = `review-${req.user.id}-${Date.now()}-${i + 1}.jpeg`;
      
      await sharp(file.buffer)
        .resize(800, 800, { fit: 'inside' })
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/images/reviews/${filename}`);
      
      req.body.images.push(`/images/reviews/${filename}`);
    })
  );
  
  next();
});

// Get all reviews (admin)
exports.getAllReviews = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status, rating } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (rating) query.rating = parseInt(rating);
  
  const reviews = await Review.find(query)
    .populate('user', 'name email')
    .populate('product', 'name price images')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Review.countDocuments(query);
  
  res.status(200).json({
    success: true,
    results: reviews.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    reviews
  });
});

// Get product reviews
exports.getProductReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sort = 'newest', rating, verified } = req.query;
  
  const query = { 
    product: productId,
    status: 'approved'
  };
  
  if (rating) query.rating = parseInt(rating);
  if (verified === 'true') query.isVerifiedPurchase = true;
  
  let sortOption = '-createdAt';
  switch(sort) {
    case 'helpful':
      sortOption = '-helpful -createdAt';
      break;
    case 'rating-high':
      sortOption = '-rating -createdAt';
      break;
    case 'rating-low':
      sortOption = 'rating -createdAt';
      break;
  }
  
  const reviews = await Review.find(query)
    .populate('user', 'name avatar')
    .sort(sortOption)
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Review.countDocuments(query);
  
  // Get rating distribution
  const ratingDistribution = await Review.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  
  // Calculate average rating
  const stats = await Review.aggregate([
    { $match: { product: mongoose.Types.ObjectId(productId), status: 'approved' } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
  
  res.status(200).json({
    success: true,
    results: reviews.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    stats: stats[0] || { avgRating: 0, totalReviews: 0 },
    ratingDistribution,
    reviews
  });
});

// Get single review
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name avatar')
    .populate('product', 'name price images');
  
  if (!review) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  res.status(200).json({
    success: true,
    review
  });
});

// Create review
exports.createReview = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { rating, title, comment, pros, cons } = req.body;
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('محصول یافت نشد', 404));
  }
  
  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: productId,
    user: req.user.id
  });
  
  if (existingReview) {
    return next(new AppError('شما قبلاً برای این محصول نظر ثبت کرده‌اید', 400));
  }
  
  // Check if user purchased this product
  const userOrders = await Order.find({
    user: req.user.id,
    'items.product': productId,
    'payment.status': 'completed'
  });
  
  const isVerifiedPurchase = userOrders.length > 0;
  
  // Create review
  const review = await Review.create({
    product: productId,
    user: req.user.id,
    rating,
    title,
    comment,
    pros,
    cons,
    images: req.body.images || [],
    isVerifiedPurchase,
    status: 'pending' // Reviews need approval
  });
  
  // Don't update product rating yet (wait for approval)
  
  res.status(201).json({
    success: true,
    message: 'نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده خواهد شد',
    review
  });
});

// Update review
exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  // Check ownership
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('شما مجاز به ویرایش این نظر نیستید', 403));
  }
  
  // Update allowed fields
  const allowedFields = ['rating', 'title', 'comment', 'pros', 'cons'];
  const updates = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  // Add new images if provided
  if (req.body.images && req.body.images.length > 0) {
    updates.images = [...review.images, ...req.body.images].slice(0, 5); // Max 5 images
  }
  
  // Reset status to pending if content changed
  if (updates.comment || updates.title) {
    updates.status = 'pending';
    updates.editedAt = Date.now();
  }
  
  // Update review
  Object.assign(review, updates);
  await review.save();
  
  res.status(200).json({
    success: true,
    message: 'نظر شما با موفقیت ویرایش شد',
    review
  });
});

// Delete review
exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  // Check ownership or admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('شما مجاز به حذف این نظر نیستید', 403));
  }
  
  // Get product to update rating
  const product = await Product.findById(review.product);
  
  await review.remove();
  
  // Update product rating if review was approved
  if (review.status === 'approved' && product) {
    await product.calculateAverageRating();
  }
  
  res.status(204).json({
    success: true,
    message: 'نظر با موفقیت حذف شد'
  });
});

// Get user's reviews
exports.getUserReviews = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const reviews = await Review.find({ user: req.user.id })
    .populate('product', 'name price images')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Review.countDocuments({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    results: reviews.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    reviews
  });
});

// Mark review as helpful
exports.markHelpful = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  // Check if user already marked this review
  const alreadyMarked = review.helpfulVotes.includes(req.user.id);
  
  if (alreadyMarked) {
    // Remove vote
    review.helpfulVotes = review.helpfulVotes.filter(
      userId => userId.toString() !== req.user.id
    );
    review.helpful = Math.max(0, review.helpful - 1);
  } else {
    // Add vote
    review.helpfulVotes.push(req.user.id);
    review.helpful += 1;
  }
  
  await review.save();
  
  res.status(200).json({
    success: true,
    helpful: review.helpful,
    marked: !alreadyMarked
  });
});

// Report review
exports.reportReview = catchAsync(async (req, res, next) => {
  const { reason, description } = req.body;
  
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    return next(new AppError('نظر یافت نشد', 404));
  }
  
  // Check if user already reported
  const alreadyReported = review.reports.some(
    report => report.user.toString() === req.user.id
  );
  
  if (alreadyReported) {
    return next(new AppError('شما قبلاً این نظر را گزارش کرده‌اید', 400));
  }
  
  // Add report
  review.reports.push({
    user: req.user.id,
    reason,
    description
  });
  
  // Auto-hide review if too many reports
  if (review.reports.length >= 5 && review.status === 'approved') {
    review.status = 'hidden';
  }
  
  await review.save();
  
  res.status(200).json({
    success: true,
    message: 'گزارش شما با موفقیت ثبت شد'
  });
});