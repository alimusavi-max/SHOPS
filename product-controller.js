const Product = require('./product-model.js');
const Category = require('./category-model.js'); // Might be needed for validation or population
const catchAsync = require('./catch-async-util.js');
const AppError = require('./app-error-util.js');
const APIFeatures = require('./api-features-util.js'); // Assuming a utility for API features like filter, sort, paginate

// Placeholder for now, will implement functions one by one.

// Example: Get All Products (will use APIFeatures or Product.searchProducts)
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // Extract query parameters for search, filtering, sorting, pagination
  const {
    search, // For text search query
    category,
    brand,
    minPrice, maxPrice,
    inStock,
    hasDiscount,
    sort,   // e.g., 'price-asc', 'price-desc', 'newest', 'rating', 'bestseller'
    page,
    limit
  } = req.query;

  const filters = {
    category, brand, minPrice, maxPrice, inStock, hasDiscount, sort, page, limit
  };

  // Remove undefined keys from filters so searchProducts method defaults work
  Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

  // The Product.searchProducts method handles text search via 'search' query
  // and other filters via the 'filters' object.
  const result = await Product.searchProducts(search, filters);

  res.status(200).json({
    status: 'success',
    results: result.products.length, // Number of products on the current page
    totalProducts: result.total,     // Total products matching criteria
    totalPages: result.pages,
    currentPage: result.page,
    data: {
      products: result.products,
    },
  });
});

// Get a single product by ID
exports.getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug') // Populate category details
    .populate('subcategory', 'name slug') // Populate subcategory if exists
    .populate({ // Populate user details within each review
        path: 'reviews.user', // Path to the user field within the embedded reviews array
        select: 'name avatar' // Select only name and avatar of the reviewer
    });

  if (!product) {
    return next(new AppError('محصولی با این شناسه یافت نشد', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

// Create a new product (Admin)
exports.createProduct = catchAsync(async (req, res, next) => {
  // Basic validation (more advanced validation should be in a middleware or model)
  const requiredFields = ['name', 'price', 'category', 'description', 'brand', 'sku'];
  // stock.quantity is also required by model, ensure it's passed or handled
  if (!req.body.stock || req.body.stock.quantity === undefined) {
    if (!req.body.stock) req.body.stock = {};
    req.body.stock.quantity = 0; // Default if not provided, model might have its own default
  }

  for (const field of requiredFields) {
    if (!req.body[field]) {
      return next(new AppError(`فیلد '${field}' الزامی است.`, 400));
    }
  }

  const newProduct = await Product.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct,
    },
  });
});

// Update a product (Admin)
exports.updateProduct = catchAsync(async (req, res, next) => {
  // Prevent slug updates directly, or handle them carefully
  if (req.body.slug) delete req.body.slug;
  if (req.body.finalPrice) delete req.body.finalPrice; // Should be calculated by pre-save hook

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the modified document
    runValidators: true, // Run model validators on update
  });

  if (!product) {
    return next(new AppError('محصولی با این شناسه برای بروزرسانی یافت نشد', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

// Delete a product (Admin)
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('محصولی با این شناسه برای حذف یافت نشد', 404));
  }

  res.status(204).json({ // 204 No Content
    status: 'success',
    data: null,
  });
});
