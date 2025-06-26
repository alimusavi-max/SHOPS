const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'محصول الزامی است']
  },
  quantity: {
    type: Number,
    required: [true, 'تعداد الزامی است'],
    min: [1, 'تعداد باید حداقل 1 باشد'],
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  // Denormalized fields for easier cart display without constant population
  name: {
    type: String,
    required: [true, 'نام محصول در سبد خرید الزامی است']
  },
  image: {
    type: String // URL or path to product image
  },
  // Storing discount on item level might be redundant if price is already final snapshot
  // However, if we want to show original price & discount, it's useful.
  // The current product model has discount, so this might be product's discount at time of add.
  discount: {
    type: Number,
    default: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'کاربر الزامی است'],
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days
  },
  // Stored calculated totals
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  totalItems: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Pre-save hook to calculate totalItems and totalPrice (excluding coupon)
cartSchema.pre('save', function(next) {
  let itemsCount = 0;
  let priceSum = 0;

  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      itemsCount += item.quantity;
      // item.price is the price of ONE unit of the product AT THE TIME IT WAS ADDED TO CART.
      // This price should already reflect any product-specific discounts.
      priceSum += (item.price * item.quantity);
    });
  }

  this.totalItems = itemsCount;
  this.totalPrice = priceSum;
  next();
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Calculate totals method (for display, including coupon)
// This method now primarily calculates the effect of a coupon on the pre-calculated totalPrice.
cartSchema.methods.calculateTotalsForDisplay = function() {
  const subtotalAfterItemDiscounts = this.totalPrice; // From pre-save hook
  let couponDiscountAmount = 0;
  
  if (this.coupon && this.coupon.code && this.coupon.discount > 0) {
    if (this.coupon.type === 'percentage') {
      couponDiscountAmount = subtotalAfterItemDiscounts * (this.coupon.discount / 100);
    } else { // fixed amount
      couponDiscountAmount = this.coupon.discount;
    }
    // Ensure coupon discount doesn't make total negative or exceed the subtotal
    couponDiscountAmount = Math.min(couponDiscountAmount, subtotalAfterItemDiscounts);
  }
  
  const finalAmount = subtotalAfterItemDiscounts - couponDiscountAmount;
  
  return {
    // subtotal: this.items.reduce((acc, item) => acc + ( (item.product.originalPrice || item.price) * item.quantity), 0), // If you need original subtotal before product discounts
    subtotalAfterItemDiscounts, // This is the sum of (item.price * item.quantity), effectively subtotal after product discounts
    couponDiscount: couponDiscountAmount,
    total: finalAmount // Final amount after coupon is applied
  };
};

// Check and update product prices
cartSchema.methods.updatePrices = async function() {
  const Product = mongoose.model('Product');
  let updated = false;
  
  for (let i = 0; i < this.items.length; i++) {
    const item = this.items[i];
    const product = await Product.findById(item.product);
    
    if (product) {
      // Update price if changed
      if (item.price !== product.price || item.discount !== product.discount) {
        item.price = product.price;
        item.discount = product.discount;
        updated = true;
      }
      
      // Remove item if out of stock
      if (product.stock.quantity === 0) {
        this.items.splice(i, 1);
        i--;
        updated = true;
      }
      // Adjust quantity if exceeds stock
      else if (item.quantity > product.stock.quantity) {
        item.quantity = product.stock.quantity;
        updated = true;
      }
    } else {
      // Remove item if product doesn't exist
      this.items.splice(i, 1);
      i--;
      updated = true;
    }
  }
  
  if (updated) {
    await this.save();
  }
  
  return updated;
};

// Apply coupon
cartSchema.methods.applyCoupon = async function(couponCode) {
  const Coupon = mongoose.model('Coupon');
  const coupon = await Coupon.findOne({ 
    code: couponCode,
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  });
  
  if (!coupon) {
    throw new Error('کد تخفیف معتبر نیست');
  }
  
  // Check usage limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('کد تخفیف به حداکثر استفاده رسیده است');
  }
  
  // Check minimum amount
  const { subtotal } = this.calculateTotals();
  if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
    throw new Error(`حداقل مبلغ خرید برای این کد تخفیف ${coupon.minimumAmount.toLocaleString()} تومان است`);
  }
  
  this.coupon = {
    code: coupon.code,
    discount: coupon.discount,
    type: coupon.type
  };
  
  await this.save();
  return coupon;
};

// Remove coupon
cartSchema.methods.removeCoupon = async function() {
  this.coupon = undefined;
  await this.save();
};

// Convert to order items
cartSchema.methods.toOrderItems = function() {
  return this.items.map(item => ({
    product: item.product._id || item.product,
    name: item.product.name || '',
    price: item.price,
    discount: item.discount,
    finalPrice: item.price - (item.price * item.discount / 100),
    quantity: item.quantity
  }));
};

// Static method to clean expired carts
cartSchema.statics.cleanExpiredCarts = async function() {
  const expiredCarts = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  return expiredCarts.deletedCount;
};

// Static method to find or create a cart for a user
cartSchema.statics.findOneOrCreate = async function(userId) {
  let cart = await this.findOne({ user: userId });
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;