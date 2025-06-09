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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Calculate totals
cartSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  let totalDiscount = 0;
  
  this.items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    const itemDiscount = (item.price * item.discount / 100) * item.quantity;
    
    subtotal += itemTotal;
    totalDiscount += itemDiscount;
  });
  
  // Apply coupon if exists
  if (this.coupon && this.coupon.code) {
    if (this.coupon.type === 'percentage') {
      const couponDiscount = (subtotal - totalDiscount) * (this.coupon.discount / 100);
      totalDiscount += couponDiscount;
    } else {
      totalDiscount += this.coupon.discount;
    }
  }
  
  const total = subtotal - totalDiscount;
  
  return {
    subtotal,
    totalDiscount,
    total
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

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;