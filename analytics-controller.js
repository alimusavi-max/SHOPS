const {
  PageView,
  ProductView,
  Conversion,
  UserBehavior,
  SalesAnalytics
} = require('../models/Analytics');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

class AnalyticsController {
  // Track page view
  trackPageView = catchAsync(async (req, res, next) => {
    const { page, duration, referrer } = req.body;
    const sessionId = req.session?.id || req.body.sessionId;
    
    // Parse user agent
    const userAgent = req.headers['user-agent'];
    const device = this.detectDevice(userAgent);
    const browser = this.detectBrowser(userAgent);
    const os = this.detectOS(userAgent);
    
    // Create page view record
    await PageView.create({
      user: req.user?.id,
      sessionId,
      page,
      referrer,
      userAgent,
      ip: req.ip,
      device,
      browser,
      os,
      duration
    });
    
    res.status(200).json({
      success: true,
      message: 'Page view tracked'
    });
  });
  
  // Track product view
  trackProductView = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { source } = req.body;
    const sessionId = req.session?.id || req.body.sessionId;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('محصول یافت نشد', 404));
    }
    
    // Create product view record
    await ProductView.create({
      product: productId,
      user: req.user?.id,
      sessionId,
      source: source || 'direct'
    });
    
    // Update product view count
    product.viewCount = (product.viewCount || 0) + 1;
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Product view tracked'
    });
  });
  
  // Track conversion
  trackConversion = catchAsync(async (req, res, next) => {
    const { type, value, productId, orderId, source, campaign } = req.body;
    const sessionId = req.session?.id || req.body.sessionId;
    
    await Conversion.create({
      type,
      user: req.user?.id,
      sessionId,
      value,
      product: productId,
      order: orderId,
      source,
      campaign
    });
    
    res.status(200).json({
      success: true,
      message: 'Conversion tracked'
    });
  });
  
  // Track user behavior
  trackUserBehavior = catchAsync(async (req, res, next) => {
    const { action, details } = req.body;
    
    if (!req.user) {
      return res.status(200).json({
        success: true,
        message: 'Anonymous behavior not tracked'
      });
    }
    
    await UserBehavior.create({
      user: req.user.id,
      action,
      details
    });
    
    res.status(200).json({
      success: true,
      message: 'User behavior tracked'
    });
  });
  
  // Get dashboard analytics (admin)
  getDashboardAnalytics = catchAsync(async (req, res, next) => {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    // Get sales analytics
    const salesData = await SalesAnalytics.getAnalytics(startDate, endDate);
    
    // Calculate totals
    const totals = salesData.reduce((acc, day) => ({
      revenue: acc.revenue + day.metrics.totalRevenue,
      orders: acc.orders + day.metrics.totalOrders,
      customers: acc.customers + day.metrics.uniqueCustomers,
      products: acc.products + day.metrics.productsSold
    }), { revenue: 0, orders: 0, customers: 0, products: 0 });
    
    // Get previous period for comparison
    const previousEndDate = new Date(startDate);
    previousEndDate.setDate(previousEndDate.getDate() - 1);
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setDate(previousStartDate.getDate() - (endDate - startDate) / (1000 * 60 * 60 * 24));
    
    const previousSalesData = await SalesAnalytics.getAnalytics(previousStartDate, previousEndDate);
    const previousTotals = previousSalesData.reduce((acc, day) => ({
      revenue: acc.revenue + day.metrics.totalRevenue,
      orders: acc.orders + day.metrics.totalOrders,
      customers: acc.customers + day.metrics.uniqueCustomers,
      products: acc.products + day.metrics.productsSold
    }), { revenue: 0, orders: 0, customers: 0, products: 0 });
    
    // Calculate growth rates
    const growth = {
      revenue: this.calculateGrowthRate(totals.revenue, previousTotals.revenue),
      orders: this.calculateGrowthRate(totals.orders, previousTotals.orders),
      customers: this.calculateGrowthRate(totals.customers, previousTotals.customers),
      products: this.calculateGrowthRate(totals.products, previousTotals.products)
    };
    
    // Get top products
    const topProductsMap = new Map();
    salesData.forEach(day => {
      day.topProducts.forEach(product => {
        const key = product.product.toString();
        if (!topProductsMap.has(key)) {
          topProductsMap.set(key, {
            product: product.product,
            quantity: 0,
            revenue: 0
          });
        }
        const item = topProductsMap.get(key);
        item.quantity += product.quantity;
        item.revenue += product.revenue;
      });
    });
    
    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Populate product details
    for (const item of topProducts) {
      item.product = await Product.findById(item.product)
        .select('name price images');
    }
    
    // Get real-time stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const realTimeStats = {
      activeUsers: await PageView.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
      }),
      todayOrders: await Order.countDocuments({
        createdAt: { $gte: today },
        'payment.status': 'completed'
      }),
      todayRevenue: await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            'payment.status': 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]).then(result => result[0]?.total || 0)
    };
    
    res.status(200).json({
      success: true,
      analytics: {
        period,
        totals,
        growth,
        chart: {
          labels: salesData.map(day => day.date.toLocaleDateString('fa-IR')),
          revenue: salesData.map(day => day.metrics.totalRevenue),
          orders: salesData.map(day => day.metrics.totalOrders)
        },
        topProducts,
        realTimeStats
      }
    });
  });
  
  // Get product analytics
  getProductAnalytics = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { period = '30d' } = req.query;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('محصول یافت نشد', 404));
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    const days = parseInt(period) || 30;
    startDate.setDate(startDate.getDate() - days);
    
    // Get product views
    const views = await ProductView.aggregate([
      {
        $match: {
          product: mongoose.Types.ObjectId(productId),
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get conversions
    const conversions = await Conversion.countDocuments({
      product: productId,
      type: 'purchase',
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    // Get cart additions
    const cartAdditions = await UserBehavior.countDocuments({
      action: 'add_to_cart',
      'details.productId': productId,
      timestamp: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate conversion rate
    const totalViews = views.reduce((sum, day) => sum + day.count, 0);
    const conversionRate = totalViews > 0 ? (conversions / totalViews) * 100 : 0;
    
    // Get sales data
    const salesData = await Order.aggregate([
      {
        $match: {
          'items.product': mongoose.Types.ObjectId(productId),
          'payment.status': 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.product': mongoose.Types.ObjectId(productId)
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.finalPrice', '$items.quantity'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      analytics: {
        product: {
          id: product._id,
          name: product.name,
          price: product.price
        },
        period: `${days}d`,
        summary: {
          totalViews,
          uniqueViewers: new Set(views.flatMap(v => v.uniqueUsers)).size,
          conversions,
          conversionRate: conversionRate.toFixed(2),
          cartAdditions,
          totalSold: salesData.reduce((sum, day) => sum + day.quantity, 0),
          totalRevenue: salesData.reduce((sum, day) => sum + day.revenue, 0)
        },
        charts: {
          views: {
            labels: views.map(v => v._id),
            data: views.map(v => v.count)
          },
          sales: {
            labels: salesData.map(s => s._id),
            quantity: salesData.map(s => s.quantity),
            revenue: salesData.map(s => s.revenue)
          }
        }
      }
    });
  });
  
  // Get user analytics
  getUserAnalytics = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('کاربر یافت نشد', 404));
    }
    
    // Get user's order history
    const orders = await Order.find({
      user: userId,
      'payment.status': 'completed'
    }).sort('-createdAt');
    
    // Calculate user metrics
    const metrics = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 ?
        orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
      firstPurchase: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
      lastPurchase: orders.length > 0 ? orders[0].createdAt : null
    };
    
    // Get user behavior
    const recentBehavior = await UserBehavior.find({ user: userId })
      .sort('-timestamp')
      .limit(50);
    
    // Get favorite categories
    const categoryCount = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product?.category) {
          const catId = item.product.category.toString();
          categoryCount.set(catId, (categoryCount.get(catId) || 0) + 1);
        }
      });
    });
    
    const favoriteCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    res.status(200).json({
      success: true,
      analytics: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          joinDate: user.createdAt
        },
        metrics,
        recentBehavior,
        favoriteCategories
      }
    });
  });
  
  // Helper methods
  detectDevice(userAgent) {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }
  
  detectBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Other';
  }
  
  detectOS(userAgent) {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'MacOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/ios/i.test(userAgent)) return 'iOS';
    return 'Other';
  }
  
  calculateGrowthRate(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  }
}

module.exports = new AnalyticsController();