const mongoose = require('mongoose'); // Added for ObjectId validation
const Product = require('./product-model.js');
const Category = require('./category-model.js');
const catchAsync = require('./catch-async-util.js');
const AppError = require('./app-error-util.js');
// const APIFeatures = require('./api-features-util.js'); // Not used if Product.searchProducts is sufficient

// Example: Get All Products (will use APIFeatures or Product.searchProducts)
exports.getAllProducts = catchAsync(async (req, res, next) => {
  // Extract query parameters for search, filtering, sorting, pagination
  let {
    search, category, brand, minPrice, maxPrice, inStock, hasDiscount, sort, page, limit
  } = req.query;

  // Validate and sanitize query parameters
  const filters = {};
  if (search) filters.search = String(search).trim();
  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
        // Allow searching by slug too, if searchProducts supports it or we adapt
        // For now, assume it might be an ID or a slug string that searchProducts can handle.
        // If it must be an ID, uncomment:
        // return next(new AppError('شناسه دسته‌بندی نامعتبر است.', 400));
    }
    filters.category = category;
  }
  if (brand) filters.brand = String(brand).trim(); // Assuming brand is a string
  if (minPrice) {
    filters.minPrice = parseFloat(minPrice);
    if (isNaN(filters.minPrice)) return next(new AppError('حداقل قیمت باید یک عدد باشد.', 400));
  }
  if (maxPrice) {
    filters.maxPrice = parseFloat(maxPrice);
    if (isNaN(filters.maxPrice)) return next(new AppError('حداکثر قیمت باید یک عدد باشد.', 400));
  }
  if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
    return next(new AppError('حداقل قیمت نمی‌تواند بیشتر از حداکثر قیمت باشد.', 400));
  }
  if (inStock !== undefined) filters.inStock = ['true', '1'].includes(String(inStock).toLowerCase());
  if (hasDiscount !== undefined) filters.hasDiscount = ['true', '1'].includes(String(hasDiscount).toLowerCase());

  const allowedSorts = ['price-asc', 'price-desc', 'rating', 'newest', 'bestseller', 'name-asc', 'name-desc'];
  if (sort && !allowedSorts.includes(sort)) {
    return next(new AppError(`مرتب‌سازی بر اساس '${sort}' مجاز نیست. مقادیر مجاز: ${allowedSorts.join(', ')}`, 400));
  }
  if (sort) filters.sort = sort;

  filters.page = Math.max(1, parseInt(page, 10) || 1);
  filters.limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10)); // Default 10, max 100

  // Product.searchProducts expects 'search' as first arg, and 'filters' object as second.
  // The filters object passed to searchProducts should contain category, brand, minPrice etc.
  // My current filters object also contains page, limit, sort which searchProducts handles.
  const result = await Product.searchProducts(filters.search, filters);

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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('شناسه محصول نامعتبر است.', 400));
  }
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
  const { name, price, category, description, brand, sku, stock, costPrice, discount, images, tags, detailedDescription, weight, dimensions, features, specifications, status, featured } = req.body;

  // --- Input Validation ---
  if (!name || !price || !category || !description || !brand || !sku ) {
    return next(new AppError('فیلدهای نام، قیمت، دسته‌بندی، توضیحات، برند و SKU الزامی هستند.', 400));
  }
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return next(new AppError('قیمت باید یک عدد مثبت باشد.', 400));
  }
  if (costPrice && (isNaN(parseFloat(costPrice)) || parseFloat(costPrice) < 0)) {
    return next(new AppError('قیمت خرید باید یک عدد غیرمنفی باشد.', 400));
  }
  if (discount && (isNaN(parseFloat(discount)) || parseFloat(discount) < 0 || parseFloat(discount) > 100)) {
    return next(new AppError('تخفیف باید عددی بین ۰ و ۱۰۰ باشد.', 400));
  }
  if (!mongoose.Types.ObjectId.isValid(category)) {
      return next(new AppError('شناسه دسته‌بندی نامعتبر است.', 400));
  }
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
      return next(new AppError('دسته‌بندی انتخاب شده یافت نشد.', 404));
  }

  let stockQuantity = 0;
  if (stock && stock.quantity !== undefined) {
    stockQuantity = parseInt(stock.quantity, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      return next(new AppError('تعداد موجودی باید یک عدد صحیح غیرمنفی باشد.', 400));
    }
  } else if (stock !== undefined && stock.quantity === undefined) { // if stock object exists but quantity is missing
     return next(new AppError('تعداد موجودی (stock.quantity) الزامی است.', 400));
  }
  // If stock object itself is not provided at all, model default might apply or validation might fail if required.
  // Model has stock.quantity required. So if req.body.stock.quantity is not passed, Mongoose validation will catch it.
  // The following ensures it's at least 0 if stock object is passed without quantity.
  const stockData = req.body.stock || {};
  if (stockData.quantity === undefined) stockData.quantity = 0;


  // Prepare data for creation, ensuring structure matches schema
  const productData = {
    name: name.trim(),
    price: parseFloat(price),
    category,
    description: description.trim(),
    brand: brand.trim(),
    sku: sku.trim(),
    stock: stockData, // Use the validated/defaulted stockData
    costPrice: costPrice ? parseFloat(costPrice) : undefined,
    discount: discount ? parseFloat(discount) : undefined,
    images: Array.isArray(images) ? images : undefined, // Ensure images is an array
    tags: Array.isArray(tags) ? tags.map(tag => tag.trim().toLowerCase()) : undefined,
    detailedDescription: detailedDescription ? detailedDescription.trim() : undefined,
    weight: weight ? parseFloat(weight) : undefined,
    dimensions, // Assuming it's an object { length, width, height }
    features: Array.isArray(features) ? features : undefined,
    specifications, // Assuming it's an object (Map in schema)
    status: status || 'active',
    featured: featured !== undefined ? Boolean(featured) : false,
  };

  const newProduct = await Product.create(productData);
  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct,
    },
  });
});

// Update a product (Admin)
exports.updateProduct = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('شناسه محصول نامعتبر است.', 400));
  }

  const { name, price, category, description, brand, sku, stock, costPrice, discount, images, tags, detailedDescription, weight, dimensions, features, specifications, status, featured } = req.body;

  // Prepare an update object with only the fields that are actually provided in the request
  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (price !== undefined) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return next(new AppError('قیمت باید یک عدد مثبت باشد.', 400));
    updateData.price = numPrice;
  }
  if (costPrice !== undefined) {
    const numCostPrice = parseFloat(costPrice);
    if (isNaN(numCostPrice) || numCostPrice < 0) return next(new AppError('قیمت خرید باید یک عدد غیرمنفی باشد.', 400));
    updateData.costPrice = numCostPrice;
  }
  if (discount !== undefined) {
    const numDiscount = parseFloat(discount);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) return next(new AppError('تخفیف باید عددی بین ۰ و ۱۰۰ باشد.', 400));
    updateData.discount = numDiscount;
  }
  if (category !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(category)) return next(new AppError('شناسه دسته‌بندی نامعتبر است.', 400));
    const categoryExists = await Category.findById(category);
    if (!categoryExists) return next(new AppError('دسته‌بندی انتخاب شده یافت نشد.', 404));
    updateData.category = category;
  }
  if (description !== undefined) updateData.description = description.trim();
  if (brand !== undefined) updateData.brand = brand.trim();
  if (sku !== undefined) updateData.sku = sku.trim();
  if (stock && stock.quantity !== undefined) {
    const stockQuantity = parseInt(stock.quantity, 10);
    if (isNaN(stockQuantity) || stockQuantity < 0) return next(new AppError('تعداد موجودی باید یک عدد صحیح غیرمنفی باشد.', 400));
    // If 'stock' is an object in schema, update nested field
    updateData['stock.quantity'] = stockQuantity;
    // The pre-save hook on product model will set inStock based on stock.quantity
  } else if (stock !== undefined && stock.quantity === undefined) {
      return next(new AppError('فیلد stock.quantity برای بروزرسانی موجودی الزامی است.', 400));
  }

  if (Array.isArray(images)) updateData.images = images; // Assuming full replacement of images array
  if (Array.isArray(tags)) updateData.tags = tags.map(tag => tag.trim().toLowerCase());
  if (detailedDescription !== undefined) updateData.detailedDescription = detailedDescription.trim();
  if (weight !== undefined) updateData.weight = parseFloat(weight);
  if (dimensions !== undefined) updateData.dimensions = dimensions; // Assuming object
  if (Array.isArray(features)) updateData.features = features;
  if (specifications !== undefined) updateData.specifications = specifications; // Assuming object
  if (status !== undefined) updateData.status = status;
  if (featured !== undefined) updateData.featured = Boolean(featured);


  // Prevent slug and finalPrice updates directly through req.body, they are handled by model hooks
  if (updateData.slug) delete updateData.slug;
  if (updateData.finalPrice) delete updateData.finalPrice;

  const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError('محصولی با این شناسه برای بروزرسانی یافت نشد.', 404));
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
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError('شناسه محصول نامعتبر است.', 400));
  }
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('محصولی با این شناسه برای حذف یافت نشد', 404));
  }

  res.status(204).json({ // 204 No Content
    status: 'success',
    data: null,
  });
});
