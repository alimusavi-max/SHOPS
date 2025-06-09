const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام کمپین الزامی است'],
    trim: true,
    maxlength: [100, 'نام کمپین نباید بیشتر از 100 کاراکتر باشد']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'توضیحات کمپین الزامی است'],
    maxlength: [500, 'توضیحات نباید بیشتر از 500 کاراکتر باشد']
  },
  type: {
    type: String,
    enum: ['flash_sale', 'seasonal', 'clearance', 'bundle', 'buy_get', 'special_offer'],
    required: [true, 'نوع کمپین الزامی است']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'ended', 'cancelled'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: [true, 'تاریخ شروع کمپین الزامی است']
  },
  endDate: {
    type: Date,
    required: [true, 'تاریخ پایان کمپین الزامی است']
  },
  rules: {
    minPurchaseAmount: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'tiered'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true
    },
    tiers: [{
      minAmount: Number,
      discountValue: Number
    }],
    buyQuantity: Number,
    getQuantity: Number,
    freeProduct: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    },
    limitPerUser: {
      type: Number,
      default: 1
    },
    totalUsageLimit: Number
  },
  targetAudience: {
    allUsers: {
      type: Boolean,
      default: true
    },
    userGroups: [{
      type: String,
      enum: ['new', 'vip', 'regular', 'inactive']
    }],
    specificUsers: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    minOrderCount: Number,
    minTotalSpent: Number,
    registrationDateFrom: Date,
    registrationDateTo: Date
  },
  products: {
    includeAll: {
      type: Boolean,
      default: false
    },
    includedProducts: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    }],
    excludedProducts: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    }],
    categories: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Category'
    }],
    brands: [String]
  },
  banners: {
    desktop: String,
    mobile: String,
    thumbnail: String
  },
  priority: {
    type: Number,
    default: 0
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalDiscount: {
      type: Number,
      default: 0
    },
    usageCount: {
      type: Number,
      default: 0
    }
  },
  usage: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    order: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order'
    },
    discountAmount: Number,
    usedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isStackable: {
    type: Boolean,
    default: false
  },
  requiresCoupon: {
    type: Boolean,
    default: false
  },
  couponCode: String,
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
campaignSchema.index({ slug: 1 });
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ 'products.categories': 1 });
campaignSchema.index({ 'products.brands': 1 });

// Virtual for checking if campaign is active
campaignSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.startDate && 
         now <= this.endDate;
});

// Virtual for remaining time
campaignSchema.virtual('remainingTime').get(function() {
  if (!this.isActive) return null;
  
  const now = new Date();
  const diff = this.endDate - now;
  
  if (diff <= 0) return 'منقضی شده';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days} روز`;
  if (hours > 0) return `${hours} ساعت`;
  return `${minutes} دقیقه`;
});

// Generate slug before save
campaignSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    const slugify = require('slugify');
    this.slug = slugify(this.name, {
      replacement: '-',
      lower: true,
      strict: true,
      locale: 'fa'
    }) + '-' + Date.now();
  }
  
  // Validate dates
  if (this.endDate <= this.startDate) {
    next(new Error('تاریخ پایان باید بعد از تاریخ شروع باشد'));
  }
  
  // Auto generate coupon code if required
  if (this.requiresCoupon && !this.couponCode) {
    this.couponCode = this.generateCouponCode();
  }
  
  next();
});

// Methods
campaignSchema.methods = {
  // Check if user is eligible
  async isUserEligible(userId) {
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) return false;
    
    // Check target audience
    if (!this.targetAudience.allUsers) {
      // Check user groups
      if (this.targetAudience.userGroups.length > 0) {
        const userGroup = await this.getUserGroup(user);
        if (!this.targetAudience.userGroups.includes(userGroup)) {
          return false;
        }
      }
      
      // Check specific users
      if (this.targetAudience.specificUsers.length > 0) {
        if (!this.targetAudience.specificUsers.includes(userId)) {
          return false;
        }
      }
      
      // Check order history
      if (this.targetAudience.minOrderCount) {
        const Order = mongoose.model('Order');
        const orderCount = await Order.countDocuments({
          user: userId,
          status: 'delivered'
        });
        if (orderCount < this.targetAudience.minOrderCount) {
          return false;
        }
      }
      
      // Check total spent
      if (this.targetAudience.minTotalSpent) {
        const totalSpent = await this.getUserTotalSpent(userId);
        if (totalSpent < this.targetAudience.minTotalSpent) {
          return false;
        }
      }
      
      // Check registration date
      if (this.targetAudience.registrationDateFrom || this.targetAudience.registrationDateTo) {
        const regDate = user.createdAt;
        if (this.targetAudience.registrationDateFrom && regDate < this.targetAudience.registrationDateFrom) {
          return false;
        }
        if (this.targetAudience.registrationDateTo && regDate > this.targetAudience.registrationDateTo) {
          return false;
        }
      }
    }
    
    // Check usage limit per user
    if (this.rules.limitPerUser) {
      const userUsageCount = this.usage.filter(
        u => u.user.toString() === userId.toString()
      ).length;
      
      if (userUsageCount >= this.rules.limitPerUser) {
        return false;
      }
    }
    
    // Check total usage limit
    if (this.rules.totalUsageLimit && this.usage.length >= this.rules.totalUsageLimit) {
      return false;
    }
    
    return true;
  },
  
  // Check if product is eligible
  isProductEligible(productId, categoryId, brand) {
    // If include all products
    if (this.products.includeAll) {
      // Check excluded products
      return !this.products.excludedProducts.some(
        p => p.toString() === productId.toString()
      );
    }
    
    // Check included products
    if (this.products.includedProducts.length > 0) {
      return this.products.includedProducts.some(
        p => p.toString() === productId.toString()
      );
    }
    
    // Check categories
    if (this.products.categories.length > 0 && categoryId) {
      const included = this.products.categories.some(
        c => c.toString() === categoryId.toString()
      );
      if (included) {
        // Still check excluded products
        return !this.products.excludedProducts.some(
          p => p.toString() === productId.toString()
        );
      }
    }
    
    // Check brands
    if (this.products.brands.length > 0 && brand) {
      const included = this.products.brands.includes(brand);
      if (included) {
        // Still check excluded products
        return !this.products.excludedProducts.some(
          p => p.toString() === productId.toString()
        );
      }
    }
    
    return false;
  },
  
  // Calculate discount for items
  calculateDiscount(items, subtotal) {
    let discountAmount = 0;
    
    switch (this.type) {
      case 'flash_sale':
      case 'seasonal':
      case 'clearance':
      case 'special_offer':
        // Simple percentage or fixed discount
        if (this.rules.discountType === 'percentage') {
          discountAmount = subtotal * (this.rules.discountValue / 100);
        } else if (this.rules.discountType === 'fixed') {
          discountAmount = this.rules.discountValue;
        } else if (this.rules.discountType === 'tiered') {
          // Tiered discount based on purchase amount
          const applicableTier = this.rules.tiers
            .filter(tier => subtotal >= tier.minAmount)
            .sort((a, b) => b.minAmount - a.minAmount)[0];
          
          if (applicableTier) {
            discountAmount = subtotal * (applicableTier.discountValue / 100);
          }
        }
        break;
      
      case 'bundle':
        // Bundle discount (e.g., buy 3 get 20% off)
        const eligibleItems = items.filter(item => {
          return this.isProductEligible(
            item.product._id || item.product,
            item.product.category,
            item.product.brand
          );
        });
        
        const totalQuantity = eligibleItems.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity >= this.rules.buyQuantity) {
          const bundleSubtotal = eligibleItems.reduce(
            (sum, item) => sum + (item.price * item.quantity),
            0
          );
          discountAmount = bundleSubtotal * (this.rules.discountValue / 100);
        }
        break;
      
      case 'buy_get':
        // Buy X Get Y (e.g., buy 2 get 1 free)
        // This type usually adds free products rather than discount
        // Implementation would depend on cart structure
        break;
    }
    
    // Apply max discount limit
    if (this.rules.maxDiscountAmount && discountAmount > this.rules.maxDiscountAmount) {
      discountAmount = this.rules.maxDiscountAmount;
    }
    
    // Apply min purchase amount
    if (this.rules.minPurchaseAmount && subtotal < this.rules.minPurchaseAmount) {
      discountAmount = 0;
    }
    
    return Math.min(discountAmount, subtotal);
  },
  
  // Record usage
  async recordUsage(userId, orderId, discountAmount) {
    this.usage.push({
      user: userId,
      order: orderId,
      discountAmount
    });
    
    this.analytics.usageCount += 1;
    this.analytics.totalDiscount += discountAmount;
    this.analytics.conversions += 1;
    
    await this.save();
  },
  
  // Update analytics
  async updateAnalytics(type, value = 1) {
    if (this.analytics[type] !== undefined) {
      this.analytics[type] += value;
      await this.save();
    }
  },
  
  // Get user group
  async getUserGroup(user) {
    const Order = mongoose.model('Order');
    
    // New user (no delivered orders)
    const orderCount = await Order.countDocuments({
      user: user._id,
      status: 'delivered'
    });
    
    if (orderCount === 0) return 'new';
    
    // Check total spent
    const totalSpent = await this.getUserTotalSpent(user._id);
    
    // VIP user (high spender)
    if (totalSpent > 50000000) return 'vip'; // 50M Tomans
    
    // Check last order date
    const lastOrder = await Order.findOne({
      user: user._id,
      status: 'delivered'
    }).sort('-createdAt');
    
    const daysSinceLastOrder = Math.floor(
      (Date.now() - lastOrder.createdAt) / (1000 * 60 * 60 * 24)
    );
    
    // Inactive user (no order in last 90 days)
    if (daysSinceLastOrder > 90) return 'inactive';
    
    // Regular user
    return 'regular';
  },
  
  // Get user total spent
  async getUserTotalSpent(userId) {
    const Order = mongoose.model('Order');
    const result = await Order.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    return result[0]?.totalSpent || 0;
  },
  
  // Generate coupon code
  generateCouponCode() {
    const prefix = this.type.toUpperCase().substring(0, 3);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  },
  
  // Activate campaign
  async activate() {
    this.status = 'active';
    await this.save();
  },
  
  // Pause campaign
  async pause() {
    this.status = 'paused';
    await this.save();
  },
  
  // End campaign
  async end() {
    this.status = 'ended';
    await this.save();
  }
};

// Static methods
campaignSchema.statics = {
  // Get active campaigns
  async getActiveCampaigns() {
    const now = new Date();
    return this.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .sort('-priority createdAt')
    .populate('products.includedProducts', 'name price images')
    .populate('products.categories', 'name');
  },
  
  // Get applicable campaigns for user
  async getApplicableCampaigns(userId, items) {
    const activeCampaigns = await this.getActiveCampaigns();
    const applicableCampaigns = [];
    
    for (const campaign of activeCampaigns) {
      const isEligible = await campaign.isUserEligible(userId);
      if (isEligible) {
        // Check if any item is eligible
        const hasEligibleItems = items.some(item => {
          return campaign.isProductEligible(
            item.product._id || item.product,
            item.product.category,
            item.product.brand
          );
        });
        
        if (hasEligibleItems || campaign.products.includeAll) {
          applicableCampaigns.push(campaign);
        }
      }
    }
    
    // Sort by priority and stackability
    return applicableCampaigns.sort((a, b) => {
      if (a.isStackable !== b.isStackable) {
        return a.isStackable ? 1 : -1; // Non-stackable first
      }
      return b.priority - a.priority;
    });
  },
  
  // Schedule campaign activation
  async scheduleActivation() {
    const now = new Date();
    const campaignsToActivate = await this.find({
      status: 'scheduled',
      startDate: { $lte: now }
    });
    
    for (const campaign of campaignsToActivate) {
      await campaign.activate();
    }
    
    return campaignsToActivate.length;
  },
  
  // End expired campaigns
  async endExpiredCampaigns() {
    const now = new Date();
    const campaignsToEnd = await this.find({
      status: { $in: ['active', 'paused'] },
      endDate: { $lt: now }
    });
    
    for (const campaign of campaignsToEnd) {
      await campaign.end();
    }
    
    return campaignsToEnd.length;
  },
  
  // Get campaign performance
  async getCampaignPerformance(campaignId) {
    const campaign = await this.findById(campaignId);
    if (!campaign) return null;
    
    const performance = {
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      duration: {
        start: campaign.startDate,
        end: campaign.endDate,
        daysActive: Math.floor((campaign.endDate - campaign.startDate) / (1000 * 60 * 60 * 24))
      },
      analytics: campaign.analytics,
      roi: campaign.analytics.totalRevenue > 0 
        ? ((campaign.analytics.totalRevenue - campaign.analytics.totalDiscount) / campaign.analytics.totalDiscount * 100).toFixed(2)
        : 0,
      conversionRate: campaign.analytics.clicks > 0
        ? (campaign.analytics.conversions / campaign.analytics.clicks * 100).toFixed(2)
        : 0,
      avgDiscountPerOrder: campaign.analytics.conversions > 0
        ? (campaign.analytics.totalDiscount / campaign.analytics.conversions).toFixed(0)
        : 0
    };
    
    return performance;
  }
};

// Middleware to auto-update campaign status
campaignSchema.pre('find', async function() {
  // Schedule activation and end expired campaigns
  await this.model.scheduleActivation();
  await this.model.endExpiredCampaigns();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;