const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get user's wishlist
exports.getWishlist = catchAsync(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user.id })
    .populate({
      path: 'items.product',
      select: 'name price discount images rating stock inStock category',
      populate: {
        path: 'category',
        select: 'name slug'
      }
    });
  
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user.id, items: [] });
  }
  
  // Remove unavailable products
  const availableItems = wishlist.items.filter(item => item.product);
  if (availableItems.length !== wishlist.items.length) {
    wishlist.items = availableItems;
    await wishlist.save();
  }
  
  res.status(200).json({
    success: true,
    results: wishlist.items.length,
    wishlist: {
      items: wishlist.items,
      totalItems: wishlist.items.length
    }
  });
});

// Add product to wishlist
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('محصول مورد نظر یافت نشد', 404));
  }
  
  // Get or create wishlist
  let wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user.id, items: [] });
  }
  
  // Check if product already in wishlist
  const existingItem = wishlist.items.find(
    item => item.product.toString() === productId
  );
  
  if (existingItem) {
    return res.status(200).json({
      success: true,
      message: 'محصول قبلاً به لیست علاقه‌مندی‌ها اضافه شده است',
      wishlist: {
        items: wishlist.items,
        totalItems: wishlist.items.length
      }
    });
  }
  
  // Add product to wishlist
  wishlist.items.push({
    product: productId,
    addedAt: new Date()
  });
  
  await wishlist.save();
  
  // Update product wishlist count
  product.wishlistCount = (product.wishlistCount || 0) + 1;
  await product.save();
  
  // Populate and return
  await wishlist.populate({
    path: 'items.product',
    select: 'name price discount images rating stock inStock category',
    populate: {
      path: 'category',
      select: 'name slug'
    }
  });
  
  res.status(200).json({
    success: true,
    message: 'محصول به لیست علاقه‌مندی‌ها اضافه شد',
    wishlist: {
      items: wishlist.items,
      totalItems: wishlist.items.length
    }
  });
});

// Remove product from wishlist
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) {
    return next(new AppError('لیست علاقه‌مندی یافت نشد', 404));
  }
  
  const itemIndex = wishlist.items.findIndex(
    item => item.product.toString() === productId
  );
  
  if (itemIndex === -1) {
    return next(new AppError('محصول در لیست علاقه‌مندی یافت نشد', 404));
  }
  
  // Remove item
  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();
  
  // Update product wishlist count
  const product = await Product.findById(productId);
  if (product && product.wishlistCount > 0) {
    product.wishlistCount -= 1;
    await product.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'محصول از لیست علاقه‌مندی حذف شد',
    wishlist: {
      items: wishlist.items,
      totalItems: wishlist.items.length
    }
  });
});

// Clear wishlist
exports.clearWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) {
    return next(new AppError('لیست علاقه‌مندی یافت نشد', 404));
  }
  
  // Update products wishlist count
  for (const item of wishlist.items) {
    const product = await Product.findById(item.product);
    if (product && product.wishlistCount > 0) {
      product.wishlistCount -= 1;
      await product.save();
    }
  }
  
  wishlist.items = [];
  await wishlist.save();
  
  res.status(200).json({
    success: true,
    message: 'لیست علاقه‌مندی خالی شد',
    wishlist: {
      items: [],
      totalItems: 0
    }
  });
});

// Check if product is in wishlist
exports.checkProductInWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  
  const isInWishlist = wishlist ? 
    wishlist.items.some(item => item.product.toString() === productId) : 
    false;
  
  res.status(200).json({
    success: true,
    isInWishlist
  });
});

// Move item from wishlist to cart
exports.moveToCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  
  // Get wishlist
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) {
    return next(new AppError('لیست علاقه‌مندی یافت نشد', 404));
  }
  
  // Check if product is in wishlist
  const itemIndex = wishlist.items.findIndex(
    item => item.product.toString() === productId
  );
  
  if (itemIndex === -1) {
    return next(new AppError('محصول در لیست علاقه‌مندی یافت نشد', 404));
  }
  
  // Check product availability
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('محصول یافت نشد', 404));
  }
  
  if (!product.inStock || product.stock.quantity < 1) {
    return next(new AppError('محصول موجود نیست', 400));
  }
  
  // Get or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  // Check if product already in cart
  const cartItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );
  
  if (cartItemIndex > -1) {
    // Update quantity
    cart.items[cartItemIndex].quantity += 1;
  } else {
    // Add to cart
    cart.items.push({
      product: productId,
      quantity: 1,
      price: product.price,
      discount: product.discount
    });
  }
  
  await cart.save();
  
  // Remove from wishlist
  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();
  
  // Update product wishlist count
  if (product.wishlistCount > 0) {
    product.wishlistCount -= 1;
    await product.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'محصول به سبد خرید منتقل شد',
    cartItemsCount: cart.items.reduce((acc, item) => acc + item.quantity, 0),
    wishlistItemsCount: wishlist.items.length
  });
});