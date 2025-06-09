const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'کاربر الزامی است']
  },
  type: {
    type: String,
    enum: [
      'order_status',      // تغییر وضعیت سفارش
      'payment',          // پرداخت
      'product_available', // موجود شدن محصول
      'price_drop',       // کاهش قیمت
      'promotion',        // تبلیغات و پروموشن
      'review_response',  // پاسخ به نظر
      'system',          // پیام‌های سیستمی
      'reminder',        // یادآوری
      'shipping',        // حمل و نقل
      'security'         // امنیتی
    ],
    required: [true, 'نوع نوتیفیکیشن الزامی است']
  },
  title: {
    type: String,
    required: [true, 'عنوان الزامی است'],
    maxlength: [100, 'عنوان نباید بیشتر از 100 کاراکتر باشد']
  },
  message: {
    type: String,
    required: [true, 'پیام الزامی است'],
    maxlength: [500, 'پیام نباید بیشتر از 500 کاراکتر باشد']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  link: String,
  icon: String,
  image: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push'],
    default: ['in_app']
  }],
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  sentAt: Date,
  deliveredAt: Date,
  expiresAt: Date,
  actions: [{
    label: String,
    url: String,
    type: {
      type: String,
      enum: ['primary', 'secondary', 'danger']
    }
  }],
  metadata: {
    orderId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Order'
    },
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product'
    },
    reviewId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Review'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Mark as sent
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Send notification through various channels
notificationSchema.methods.send = async function() {
  const emailService = require('../services/emailService');
  const smsService = require('../services/smsService');
  
  try {
    // In-app notification is already created
    
    // Send email if enabled
    if (this.channels.includes('email')) {
      const user = await mongoose.model('User').findById(this.user);
      if (user && user.email) {
        await emailService.sendNotificationEmail(user, this);
      }
    }
    
    // Send SMS if enabled
    if (this.channels.includes('sms')) {
      const user = await mongoose.model('User').findById(this.user);
      if (user && user.phone) {
        await smsService.sendNotificationSMS(user.phone, this.message);
      }
    }
    
    // Send push notification if enabled
    if (this.channels.includes('push')) {
      // Implement push notification logic
      // await pushService.send(this.user, this);
    }
    
    await this.markAsSent();
  } catch (error) {
    this.status = 'failed';
    await this.save();
    throw error;
  }
};

// Static methods
notificationSchema.statics = {
  // Get unread count for user
  async getUnreadCount(userId) {
    return this.countDocuments({
      user: userId,
      read: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });
  },
  
  // Get notifications for user
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type = null
    } = options;
    
    const query = {
      user: userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };
    
    if (unreadOnly) query.read = false;
    if (type) query.type = type;
    
    const notifications = await this.find(query)
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('metadata.orderId', 'orderNumber')
      .populate('metadata.productId', 'name images')
      .populate('metadata.reviewId', 'rating comment');
    
    const total = await this.countDocuments(query);
    
    return {
      notifications,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  },
  
  // Mark all as read for user
  async markAllAsRead(userId) {
    return this.updateMany(
      {
        user: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );
  },
  
  // Create order notification
  async createOrderNotification(userId, order, status) {
    const messages = {
      processing: 'سفارش شما در حال پردازش است',
      packaged: 'سفارش شما بسته‌بندی شد',
      shipped: 'سفارش شما ارسال شد',
      delivered: 'سفارش شما تحویل داده شد',
      cancelled: 'سفارش شما لغو شد'
    };
    
    return this.create({
      user: userId,
      type: 'order_status',
      title: `وضعیت سفارش #${order.orderNumber}`,
      message: messages[status],
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status
      },
      link: `/orders/${order._id}`,
      priority: status === 'cancelled' ? 'high' : 'medium',
      channels: ['in_app', 'email', 'sms'],
      metadata: {
        orderId: order._id
      }
    });
  },
  
  // Create price drop notification
  async createPriceDropNotification(userId, product, oldPrice, newPrice) {
    const discount = Math.round((oldPrice - newPrice) / oldPrice * 100);
    
    return this.create({
      user: userId,
      type: 'price_drop',
      title: 'کاهش قیمت!',
      message: `قیمت ${product.name} ${discount}% کاهش یافت`,
      data: {
        productId: product._id,
        oldPrice,
        newPrice,
        discount
      },
      link: `/products/${product._id}`,
      image: product.images?.[0],
      priority: 'medium',
      channels: ['in_app', 'email'],
      metadata: {
        productId: product._id
      },
      actions: [
        {
          label: 'مشاهده محصول',
          url: `/products/${product._id}`,
          type: 'primary'
        }
      ]
    });
  },
  
  // Create product available notification
  async createProductAvailableNotification(userId, product) {
    return this.create({
      user: userId,
      type: 'product_available',
      title: 'محصول موجود شد!',
      message: `${product.name} اکنون در دسترس است`,
      data: {
        productId: product._id,
        stock: product.stock.quantity
      },
      link: `/products/${product._id}`,
      image: product.images?.[0],
      priority: 'high',
      channels: ['in_app', 'email', 'push'],
      metadata: {
        productId: product._id
      },
      actions: [
        {
          label: 'خرید محصول',
          url: `/products/${product._id}`,
          type: 'primary'
        }
      ],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  },
  
  // Clean old notifications
  async cleanOldNotifications(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.deleteMany({
      read: true,
      createdAt: { $lt: cutoffDate }
    });
  }
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set default expiry for certain types
  if (!this.expiresAt) {
    switch (this.type) {
      case 'promotion':
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'reminder':
        this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        break;
    }
  }
  
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;