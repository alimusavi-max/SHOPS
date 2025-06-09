const mongoose = require('mongoose');

// Schema for tracking page views
const pageViewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  page: {
    type: String,
    required: true
  },
  referrer: String,
  userAgent: String,
  ip: String,
  country: String,
  city: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  },
  browser: String,
  os: String,
  duration: Number, // Time spent on page in seconds
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for tracking product views
const productViewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  sessionId: String,
  source: {
    type: String,
    enum: ['direct', 'search', 'category', 'recommendation', 'external']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for tracking conversions
const conversionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['purchase', 'signup', 'newsletter', 'wishlist', 'cart'],
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  sessionId: String,
  value: Number, // Monetary value for purchase conversions
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order'
  },
  source: String,
  campaign: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for user behavior tracking
const userBehaviorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['search', 'filter', 'sort', 'add_to_cart', 'remove_from_cart', 
           'add_to_wishlist', 'share', 'review', 'compare'],
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema for sales analytics
const salesAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  metrics: {
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    uniqueCustomers: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    returningCustomers: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    cartAbandonmentRate: { type: Number, default: 0 },
    productsSold: { type: Number, default: 0 }
  },
  topProducts: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    },
    quantity: Number,
    revenue: Number
  }],
  topCategories: [{
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category'
    },
    quantity: Number,
    revenue: Number
  }],
  paymentMethods: [{
    method: String,
    count: Number,
    amount: Number
  }],
  hourlyDistribution: [{
    hour: Number,
    orders: Number,
    revenue: Number
  }]
});

// Indexes
pageViewSchema.index({ timestamp: -1 });
pageViewSchema.index({ sessionId: 1 });
pageViewSchema.index({ user: 1 });
productViewSchema.index({ product: 1, timestamp: -1 });
conversionSchema.index({ type: 1, timestamp: -1 });
userBehaviorSchema.index({ user: 1, timestamp: -1 });
salesAnalyticsSchema.index({ date: -1 });

// Static methods for analytics
salesAnalyticsSchema.statics = {
  // Generate daily analytics
  async generateDailyAnalytics(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const Order = mongoose.model('Order');
    const User = mongoose.model('User');
    
    // Get orders for the day
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      'payment.status': 'completed'
    }).populate('items.product');
    
    // Calculate metrics
    const metrics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 ? 
        orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
      uniqueCustomers: new Set(orders.map(order => order.user.toString())).size
    };
    
    // Calculate top products
    const productMap = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            product: item.product._id,
            quantity: 0,
            revenue: 0
          });
        }
        const prod = productMap.get(productId);
        prod.quantity += item.quantity;
        prod.revenue += item.finalPrice * item.quantity;
      });
    });
    
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Save analytics
    await this.findOneAndUpdate(
      { date: startOfDay },
      {
        date: startOfDay,
        metrics,
        topProducts
      },
      { upsert: true }
    );
  },
  
  // Get analytics for date range
  async getAnalytics(startDate, endDate) {
    return this.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort('date');
  },
  
  // Get revenue trends
  async getRevenueTrends(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const analytics = await this.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort('date');
    
    return analytics.map(day => ({
      date: day.date,
      revenue: day.metrics.totalRevenue,
      orders: day.metrics.totalOrders
    }));
  }
};

// Models
const PageView = mongoose.model('PageView', pageViewSchema);
const ProductView = mongoose.model('ProductView', productViewSchema);
const Conversion = mongoose.model('Conversion', conversionSchema);
const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);
const SalesAnalytics = mongoose.model('SalesAnalytics', salesAnalyticsSchema);

module.exports = {
  PageView,
  ProductView,
  Conversion,
  UserBehavior,
  SalesAnalytics
};