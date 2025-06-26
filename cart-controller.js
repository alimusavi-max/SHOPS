const Cart = require('./cart-model.js'); // Corrected path
const Product = require('./product-model.js'); // Corrected path
const catchAsync = require('./catch-async-util.js'); // Corrected path
const AppError = require('./app-error-util.js'); // Corrected path

// Utility to populate product details in cart items more consistently
const populateCartItemProducts = async (cart) => {
  if (cart && cart.items && cart.items.length > 0) {
    await cart.populate({
      path: 'items.product',
      select: 'name images slug price discount stock status finalPrice actualStock', // Ensure all needed fields are selected
    });
  }
  return cart;
};

// Get user's cart
exports.getCart = catchAsync(async (req, res, next) => {
  let cart = await Cart.findOneOrCreate(req.user.id); // Uses static method from model

  // Sync prices and stock with current product data, remove unavailable items
  await cart.updatePrices(); // This method saves the cart if changes occur
  
  // After updatePrices might have modified and saved, totals are up-to-date in DB.
  // We fetch again or use the returned cart if updatePrices returns it.
  // For simplicity, let's assume cart object is updated in place by updatePrices if it saves.
  // If updatePrices doesn't return the updated cart, a fresh find might be safer:
  // cart = await Cart.findOneOrCreate(req.user.id);

  cart = await populateCartItemProducts(cart);
  const displayTotals = cart.calculateTotalsForDisplay(); // Includes coupon calculation

  res.status(200).json({
    success: true,
    data: { // Standardized response structure
      cart: {
        _id: cart._id,
        user: cart.user,
        items: cart.items,
        coupon: cart.coupon,
        totalItems: cart.totalItems, // From pre-save hook
        totalPrice: cart.totalPrice, // From pre-save hook (sum of item.price * quantity)
        // Display totals including coupon effect
        displaySubtotal: displayTotals.subtotalAfterItemDiscounts,
        displayCouponDiscount: displayTotals.couponDiscount,
        displayTotal: displayTotals.total,
      }
    }
  });
});

// Add item to cart
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.id;

  const nQuantity = Number(quantity);
  if (!productId || !Number.isInteger(nQuantity) || nQuantity < 1) {
    return next(new AppError('شناسه محصول و تعداد معتبر مورد نیاز است.', 400));
  }

  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') {
    return next(new AppError('محصول یافت نشد یا در دسترس نیست.', 404));
  }

  if (product.actualStock < nQuantity) { // Use virtual 'actualStock'
    return next(new AppError(`موجودی محصول کافی نیست (موجود: ${product.actualStock}).`, 400));
  }

  const cart = await Cart.findOneOrCreate(userId);
  const existingItem = cart.items.find(item => item.product.toString() === productId);

  if (existingItem) {
    const newQuantityForItem = existingItem.quantity + nQuantity;
    if (newQuantityForItem > product.actualStock) { // Check total quantity against stock
      // Optionally, set to max available stock or return error
      // For now, let's cap it or error. Let's error for clarity.
      return next(new AppError(`موجودی محصول (${product.actualStock} عدد) برای افزایش تعداد کافی نیست. شما ${existingItem.quantity} عدد در سبد دارید.`, 400));
      // existingItem.quantity = product.actualStock;
    } else {
      existingItem.quantity = newQuantityForItem;
    }
    // Price, name, image for existing item are not updated here, relying on initial add or updatePrices()
  } else {
    cart.items.push({
      product: productId,
      quantity: nQuantity,
      price: product.finalPrice, // Store the product's current finalPrice (after its own discount)
      name: product.name, // Denormalized
      image: product.images && product.images.length > 0 ? (product.images.find(img => img.isMain)?.url || product.images[0].url) : undefined, // Denormalized
      discount: product.discount, // Store product's own discount for reference if needed
    });
  }

  await cart.save(); // Pre-save hook calculates totalItems and totalPrice
  let populatedCart = await populateCartItemProducts(cart);
  const displayTotals = populatedCart.calculateTotalsForDisplay();

  res.status(200).json({
    success: true,
    message: 'محصول به سبد خرید اضافه شد',
    data: { // Standardized response
      cart: {
        _id: populatedCart._id,
        user: populatedCart.user,
        items: populatedCart.items,
        coupon: populatedCart.coupon,
        totalItems: populatedCart.totalItems,
        totalPrice: populatedCart.totalPrice,
        displaySubtotal: displayTotals.subtotalAfterItemDiscounts,
        displayCouponDiscount: displayTotals.couponDiscount,
        displayTotal: displayTotals.total,
      }
    }
  });
});

// Update cart item quantity
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  const newQuantity = Number(quantity);
  if (!Number.isInteger(newQuantity) || newQuantity < 0) { // Allow 0 to trigger removal
    return next(new AppError('تعداد باید یک عدد صحیح غیرمنفی باشد.', 400));
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError('سبد خرید یافت نشد.', 404));
  }

  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
  if (itemIndex === -1) {
    return next(new AppError('محصول در سبد خرید یافت نشد.', 404));
  }

  if (newQuantity === 0) {
    cart.items.splice(itemIndex, 1); // Remove item if quantity is 0
  } else {
    const product = await Product.findById(productId); // Fetch product to check stock
    if (!product) {
      // This case implies data inconsistency if item was in cart but product is gone
      cart.items.splice(itemIndex, 1);
      await cart.save();
      return next(new AppError('محصول اصلی دیگر موجود نیست و از سبد شما حذف شد.', 404));
    }
    if (product.actualStock < newQuantity) {
      return next(new AppError(`موجودی محصول (${product.actualStock} عدد) برای تعداد درخواستی کافی نیست.`, 400));
    }
    cart.items[itemIndex].quantity = newQuantity;
    // Item's price, name, image are not updated here. updatePrices() handles price sync if needed.
  }
  
  await cart.save();
  let populatedCart = await populateCartItemProducts(cart);
  const displayTotals = populatedCart.calculateTotalsForDisplay();

  res.status(200).json({
    success: true,
    message: 'سبد خرید بروزرسانی شد',
    data: { // Standardized response
       cart: {
        _id: populatedCart._id,
        user: populatedCart.user,
        items: populatedCart.items,
        coupon: populatedCart.coupon,
        totalItems: populatedCart.totalItems,
        totalPrice: populatedCart.totalPrice,
        displaySubtotal: displayTotals.subtotalAfterItemDiscounts,
        displayCouponDiscount: displayTotals.couponDiscount,
        displayTotal: displayTotals.total,
      }
    }
  });
});

// Remove item from cart
exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return res.status(200).json({ // Or 404, but for idempotency 200 is fine
        status: 'success',
        message: 'محصولی برای حذف در سبد خرید یافت نشد.',
        data: { cart: null } // Or an empty cart structure
    });
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter(item => item.product.toString() !== productId);

  if (cart.items.length === initialLength && initialLength > 0) { // Check if item was actually found and removed
    return next(new AppError('محصول در سبد خرید یافت نشد.', 404));
  }

  await cart.save();
  let populatedCart = await populateCartItemProducts(cart);
  const displayTotals = populatedCart.calculateTotalsForDisplay();

  res.status(200).json({
    success: true,
    message: 'محصول از سبد خرید حذف شد',
    data: { // Standardized response
       cart: {
        _id: populatedCart._id,
        user: populatedCart.user,
        items: populatedCart.items,
        coupon: populatedCart.coupon,
        totalItems: populatedCart.totalItems,
        totalPrice: populatedCart.totalPrice,
        displaySubtotal: displayTotals.subtotalAfterItemDiscounts,
        displayCouponDiscount: displayTotals.couponDiscount,
        displayTotal: displayTotals.total,
      }
    }
  });
});

// Clear entire cart
exports.clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId });

  if (cart) {
    cart.items = [];
    cart.coupon = undefined; // Also clear any applied coupon
    await cart.save();

    // No need to populate an empty cart's items
    const displayTotals = cart.calculateTotalsForDisplay(); // will be 0
     res.status(200).json({
        success: true,
        message: 'سبد خرید خالی شد',
        data: { // Standardized response
          cart: {
            _id: cart._id,
            user: cart.user,
            items: cart.items,
            coupon: cart.coupon,
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice,
            displaySubtotal: displayTotals.subtotalAfterItemDiscounts,
            displayCouponDiscount: displayTotals.couponDiscount,
            displayTotal: displayTotals.total,
          }
        },
      });
  } else {
    // If no cart exists, it's effectively already clear.
    res.status(200).json({
      success: true,
      message: 'سبد خریدی برای خالی کردن یافت نشد.',
      data: { cart: null }, // Or return a new empty cart structure
    });
  }
});

// Sync Cart - Simplified: Client sends its items, server attempts to add them to a fresh server cart.
// This effectively means client state can override server state if products are valid and in stock.
// A more robust sync would merge quantities based on timestamps or specific rules.
exports.syncCart = catchAsync(async (req, res, next) => {
    const { items: clientItems } = req.body; // Expects array of { productId, quantity }
    const userId = req.user.id;

    if (!Array.isArray(clientItems)) {
        return next(new AppError('فرمت آیتم‌های ارسالی نامعتبر است.', 400));
    }

    const cart = await Cart.findOneOrCreate(userId);
    cart.items = []; // Start with an empty server cart for this sync logic

    for (const clientItem of clientItems) {
        if (!clientItem.productId || !Number.isInteger(clientItem.quantity) || clientItem.quantity < 1) {
            console.warn(`Skipping invalid item in sync: ${JSON.stringify(clientItem)}`);
            continue;
        }
        const product = await Product.findById(clientItem.productId);
        if (product && product.status === 'active' && product.actualStock >= clientItem.quantity) {
            cart.items.push({
                product: product._id,
                quantity: clientItem.quantity,
                price: product.finalPrice, // Use current finalPrice from product
                name: product.name,
                image: product.images && product.images.length > 0 ? (product.images.find(img => img.isMain)?.url || product.images[0].url) : undefined,
                discount: product.discount,
            });
        } else {
            console.warn(`Product ${clientItem.productId} could not be synced (not found, inactive, or insufficient stock: ${product?.actualStock} vs ${clientItem.quantity}).`);
            // Optionally, collect messages about items that couldn't be synced to send to client
        }
    }

    cart.coupon = undefined; // Clear any existing coupon on sync
    await cart.save(); // Pre-save hook will update totals

    let populatedCart = await populateCartItemProducts(cart);
    const displayTotals = populatedCart.calculateTotalsForDisplay();

    res.status(200).json({
        success: true,
        message: 'سبد خرید با سرور همگام‌سازی شد.',
        data: { // Standardized response
             cart: {
                _id: populatedCart._id,
                user: populatedCart.user,
                items: populatedCart.items,
                coupon: populatedCart.coupon,
                totalItems: populatedCart.totalItems,
                totalPrice: populatedCart.totalPrice,
                displaySubtotal: displayTotals.subtotalAfterItemDiscounts,
                displayCouponDiscount: displayTotals.couponDiscount,
                displayTotal: displayTotals.total,
            }
        }
    });
});