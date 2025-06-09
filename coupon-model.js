const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'کد تخفیف الزامی است'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [4, 'کد تخفیف باید حداقل 4 کاراکتر باشد'],
    maxlength: [20, 'کد تخفیف نباید بیشتر از 20 کاراکتر باشد']
  },
  description: {
    type: String,
    required: [true, 'توضیحات کوپن الزامی است'],
    maxlength: [200, 'توضیحات نباید بیشتر از 200 کاراکتر باشد']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'نوع تخفیف الزامی است']
  },
  discount: {
    type: Number,
    required: [true, 'مقدار تخفیف الزامی است'],
    min: [0, 'تخفیف نمی‌تواند منفی باشد']
  },
  minimumAmount: {
    type: Number,
    default: 0,
    min: [0, 'حداقل مبلغ نمی‌تواند منفی باشد']
  },
  maximumDiscount: {
    type: Number,
    min: [0, 'حداکثر تخفیف نمی‌تواند منفی باشد']
  },
  validFrom: {
    type: Date,
    required: [true, 'تاریخ شروع اعتبار الزامی است']
  },
  validUntil: {
    type: Date,
    required: [true, 'تاریخ پایان اعتبار الزامی است']
  },
  usageLimit: {
    type: Number,
    min: [0, 'محدودیت استفاده نمی‌تواند منفی باشد']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  perUserLimit: {
    type: Number,
    default: 1,
    min: [1, 'محدودیت هر کاربر باید حداقل 1 باشد']
  },
  categories: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Category'
  }],
  products: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  }],
  users: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  usedBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    order: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    discountAmount: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFreeShipping: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ categories: 1 });
couponSchema.index({ products: 1 });

// Virtual for checking if coupon is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         now >= this.validFrom && 
         now <= this.validUntil &&
         (!this.usageLimit || this.usedCount < this.usageLimit);
});

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function() {
  if (!this.usageLimit) return Infinity;
  return Math.max(0, this.usageLimit - this.usedCount);
});

// Validate discount value based on type
couponSchema.pre('save', function(next) {
  if (this.type === 'percentage') {
    if (this.discount > 100) {
      next(new Error('تخفیف درصدی نمی‌تواند بیشتر از 100% باشد'));
    }
  }
  
  // Ensure validUntil is after validFrom
  if (this.validUntil <= this.validFrom) {
    next(new Error('تاریخ پایان باید بعد از تاریخ شروع باشد'));
  }
  
  next();
});

// Instance methods
couponSchema.methods = {
  // Check if coupon can be used by a user
  async canBeUsedBy(userId) {
    // Check if active and within date range
    if (!this.isValid) {
      return { valid: false, reason: 'کد تخفیف منقضی شده یا غیرفعال است' };
    }
    
    // Check user-specific restrictions
    if (this.users.length > 0 && !this.users.includes(userId)) {
      return { valid: false, reason: 'این کد تخفیف برای شما قابل استفاده نیست' };
    }
    
    // Check per-user usage limit
    const userUsageCount = this.usedBy.filter(
      usage => usage.user.toString() === userId.toString()
    ).length;
    
    if (userUsageCount >= this.perUserLimit) {
      return { valid: false, reason: 'شما قبلاً از این کد تخفیف استفاده کرده‌اید' };
    }
    
    return { valid: true };
  },
  
  // Calculate discount for given items
  calculateDiscount(items, subtotal) {
    let eligibleAmount = 0;
    
    // If specific products/categories are set, calculate eligible amount
    if (this.products.length > 0 || this.categories.length > 0) {
      items.forEach(item => {
        const productId = item.product._id || item.product;
        const categoryId = item.product.category?._id || item.product.category;
        
        // Check if product is excluded
        if (this.excludedProducts.some(p => p.toString() === productId.toString())) {
          return;
        }
        
        // Check if product or category is eligible
        const productEligible = this.products.length === 0 || 
          this.products.some(p => p.toString() === productId.toString());
          
        const categoryEligible = this.categories.length === 0 || 
          this.categories.some(c => c.toString() === categoryId?.toString());
        
        if (productEligible || categoryEligible) {
          const itemTotal = item.finalPrice * item.quantity;
          eligibleAmount += itemTotal;
        }
      });
    } else {
      eligibleAmount = subtotal;
    }
    
    // Check minimum amount
    if (eligibleAmount < this.minimumAmount) {
      return 0;
    }
    
    // Calculate discount
    let discountAmount;
    if (this.type === 'percentage') {
      discountAmount = eligibleAmount * (this.discount / 100);
    } else {
      discountAmount = this.discount;
    }
    
    // Apply maximum discount limit
    if (this.maximumDiscount) {
      discountAmount = Math.min(discountAmount, this.maximumDiscount);
    }
    
    // Ensure discount doesn't exceed eligible amount
    return Math.min(discountAmount, eligibleAmount);
  },
  
  // Use coupon
  async use(userId, orderId, discountAmount) {
    this.usedBy.push({
      user: userId,
      order: orderId,
      discountAmount
    });
    this.usedCount += 1;
    
    await this.save();
    return this;
  }
};

// Static methods
couponSchema.statics = {
  // Find valid coupon by code
  async findValidByCode(code) {
    const coupon = await this.findOne({
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });
    
    if (!coupon) {
      return null;
    }
    
    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return null;
    }
    
    return coupon;
  },
  
  // Get active coupons
  async getActiveCoupons() {
    const now = new Date();
    return this.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now }
    }).sort('-createdAt');
  },
  
  // Get user's available coupons
  async getUserCoupons(userId) {
    const now = new Date();
    const allCoupons = await this.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { users: { $size: 0 } }, // Public coupons
        { users: userId } // User-specific coupons
      ]
    });
    
    // Filter out fully used coupons
    return allCoupons.filter(coupon => {
      // Check global usage limit
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return false;
      }
      
      // Check per-user usage limit
      const userUsageCount = coupon.usedBy.filter(
        usage => usage.user.toString() === userId.toString()
      ).length;
      
      return userUsageCount < coupon.perUserLimit;
    });
  },
  
  // Generate unique code
  async generateUniqueCode(prefix = 'COUP', length = 8) {
    let code;
    let exists = true;
    
    while (exists) {
      const randomStr = Math.random().toString(36).substr(2, length).toUpperCase();
      code = `${prefix}${randomStr}`;
      exists = await this.exists({ code });
    }
    
    return code;
  }
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;