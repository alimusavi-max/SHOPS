const Cart = require('../models/Cart');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Get user's cart
exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name price discount images stock');
  
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  // Calculate totals
  const { subtotal, totalDiscount, total } = cart.calculateTotals();
  
  res.status(200).json({
    success: true,
    cart: {
      items: cart.items,
      subtotal,
      totalDiscount,
      total,
      itemsCount: cart.items.reduce((acc, item) => acc + item.quantity, 0)
    }
  });
});

// Add item to cart
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  
  // Validate product
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError('محصول مورد نظر یافت نشد', 404));
  }
  
  // Check stock
  if (product.stock.quantity < quantity) {
    return next(new AppError('موجودی کافی نیست', 400));
  }
  
  // Get or create cart
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );
  
  if (existingItemIndex > -1) {
    // Update quantity
    cart.items[existingItemIndex].quantity += quantity;
    
    // Check stock again
    if (product.stock.quantity < cart.items[existingItemIndex].quantity) {
      return next(new AppError('موجودی کافی نیست', 400));
    }
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      discount: product.discount
    });
  }
  
  await cart.save();
  
  // Populate and return
  await cart.populate('items.product', 'name price discount images stock');
  const { subtotal, totalDiscount, total } = cart.calculateTotals();
  
  res.status(200).json({
    success: true,
    message: 'محصول به سبد خرید اضافه شد',
    cart: {
      items: cart.items,
      subtotal,
      totalDiscount,
      total,
      itemsCount: cart.items.reduce((acc, item) => acc + item.quantity, 0)
    }
  });
});

// Update cart item quantity
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  
  if (quantity < 1) {
    return next(new AppError('تعداد باید حداقل 1 باشد', 400));
  }
  
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('سبد خرید یافت نشد', 404));
  }
  
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );
  
  if (itemIndex === -1) {
    return next(new AppError('محصول در سبد خرید یافت نشد', 404));
  }
  
  // Check stock
  const product = await Product.findById(productId);
  if (product.stock.quantity < quantity) {
    return next(new AppError('موجودی کافی نیست', 400));
  }
  
  cart.items[itemIndex].quantity = quantity;
  await cart.save();
  
  await cart.populate('items.product', 'name price discount images stock');
  const { subtotal, totalDiscount, total } = cart.calculateTotals();
  
  res.status(200).json({
    success: true,
    message: 'سبد خرید بروزرسانی شد',
    cart: {
      items: cart.items,
      subtotal,
      totalDiscount,
      total,
      itemsCount: cart.items.reduce((acc, item) => acc + item.quantity, 0)
    }
  });
});

// Remove item from cart
exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('سبد خرید یافت نشد', 404));
  }
  
  cart.items = cart.items.filter(
    item => item.product.toString() !== productId
  );
  
  await cart.save();
  
  await cart.populate('items.product', 'name price discount images stock');
  const { subtotal, totalDiscount, total } = cart.calculateTotals();
  
  res.status(200).json({
    success: true,
    message: 'محصول از سبد خرید حذف شد',
    cart: {
      items: cart.items,
      subtotal,
      totalDiscount,
      total,
      itemsCount: cart.items.reduce((acc, item) => acc + item.quantity, 0)
    }
  });
});

// Clear cart
exports.clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    return next(new AppError('سبد خرید یافت نشد', 404));
  }
  
  cart.items = [];
  await cart.save();
  
  res.status(200).json({
    success: true,
    message: 'سبد خرید خالی شد',
    cart: {
      items: [],
      subtotal: 0,
      totalDiscount: 0,
      total: 0,
      itemsCount: 0
    }
  });
});

// Sync cart (merge local cart with server cart)
exports.syncCart = catchAsync(async (req, res, next) => {
  const { items } = req.body;
  
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }
  
  // Merge items
  for (const localItem of items) {
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === localItem.productId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity to max of local and server
      cart.items[existingItemIndex].quantity = Math.max(
        cart.items[existingItemIndex].quantity,
        localItem.quantity
      );
    } else {
      // Add new item
      const product = await Product.findById(localItem.productId);
      if (product && product.stock.quantity >= localItem.quantity) {
        cart.items.push({
          product: localItem.productId,
          quantity: localItem.quantity,
          price: product.price,
          discount: product.discount
        });
      }
    }
  }
  
  await cart.save();
  
  await cart.populate('items.product', 'name price discount images stock');
  const { subtotal, totalDiscount, total } = cart.calculateTotals();
  
  res.status(200).json({
    success: true,
    message: 'سبد خرید همگام‌سازی شد',
    cart: {
      items: cart.items,
      subtotal,
      totalDiscount,
      total,
      itemsCount: cart.items.reduce((acc, item) => acc + item.quantity, 0)
    }
  });
});