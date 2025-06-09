const Category = require('../models/Category');
const Product = require('../models/Product');
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
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

exports.uploadCategoryImage = upload.single('image');

exports.resizeCategoryImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  
  // Create filename
  req.file.filename = `category-${req.params.id || Date.now()}-${Date.now()}.jpeg`;
  
  // Resize and save image
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/categories/${req.file.filename}`);
  
  next();
});

// Get all categories
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find()
    .populate('parent', 'name slug')
    .sort('order name');
  
  res.status(200).json({
    success: true,
    results: categories.length,
    categories
  });
});

// Get category tree (hierarchical structure)
exports.getCategoryTree = catchAsync(async (req, res, next) => {
  const categories = await Category.find({ parent: null })
    .populate({
      path: 'children',
      populate: {
        path: 'children'
      }
    })
    .sort('order name');
  
  res.status(200).json({
    success: true,
    categories
  });
});

// Get single category
exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('parent', 'name slug')
    .populate('children', 'name slug image productsCount');
  
  if (!category) {
    return next(new AppError('دسته‌بندی یافت نشد', 404));
  }
  
  res.status(200).json({
    success: true,
    category
  });
});

// Create category
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, parent, order, isActive, metaTitle, metaDescription } = req.body;
  
  const categoryData = {
    name,
    description,
    parent: parent || null,
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true,
    metaTitle,
    metaDescription
  };
  
  // Add image if uploaded
  if (req.file) {
    categoryData.image = `/images/categories/${req.file.filename}`;
  }
  
  const category = await Category.create(categoryData);
  
  res.status(201).json({
    success: true,
    message: 'دسته‌بندی با موفقیت ایجاد شد',
    category
  });
});

// Update category
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { name, description, parent, order, isActive, metaTitle, metaDescription } = req.body;
  
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('دسته‌بندی یافت نشد', 404));
  }
  
  // Update fields
  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (parent !== undefined) category.parent = parent || null;
  if (order !== undefined) category.order = order;
  if (isActive !== undefined) category.isActive = isActive;
  if (metaTitle) category.metaTitle = metaTitle;
  if (metaDescription) category.metaDescription = metaDescription;
  
  // Update image if uploaded
  if (req.file) {
    category.image = `/images/categories/${req.file.filename}`;
  }
  
  await category.save();
  
  res.status(200).json({
    success: true,
    message: 'دسته‌بندی با موفقیت بروزرسانی شد',
    category
  });
});

// Delete category
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('دسته‌بندی یافت نشد', 404));
  }
  
  // Check if category has products
  const productsCount = await Product.countDocuments({ category: category._id });
  if (productsCount > 0) {
    return next(new AppError('این دسته‌بندی دارای محصول است و قابل حذف نیست', 400));
  }
  
  // Check if category has children
  const childrenCount = await Category.countDocuments({ parent: category._id });
  if (childrenCount > 0) {
    return next(new AppError('این دسته‌بندی دارای زیرمجموعه است و قابل حذف نیست', 400));
  }
  
  await category.remove();
  
  res.status(204).json({
    success: true,
    message: 'دسته‌بندی با موفقیت حذف شد'
  });
});

// Get category products
exports.getCategoryProducts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, sort = '-createdAt', ...filters } = req.query;
  
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('دسته‌بندی یافت نشد', 404));
  }
  
  // Get all subcategory IDs
  const categoryIds = [category._id];
  const subcategories = await Category.find({ parent: category._id }).select('_id');
  categoryIds.push(...subcategories.map(cat => cat._id));
  
  // Build query
  const query = {
    category: { $in: categoryIds },
    status: 'active',
    ...filters
  };
  
  // Apply price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query.finalPrice = {};
    if (req.query.minPrice) query.finalPrice.$gte = parseInt(req.query.minPrice);
    if (req.query.maxPrice) query.finalPrice.$lte = parseInt(req.query.maxPrice);
  }
  
  // Apply discount filter
  if (req.query.hasDiscount === 'true') {
    query.discount = { $gt: 0 };
  }
  
  // Apply in stock filter
  if (req.query.inStock === 'true') {
    query.inStock = true;
  }
  
  // Execute query with pagination
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    success: true,
    category: {
      id: category._id,
      name: category.name,
      slug: category.slug
    },
    results: products.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    products
  });
});