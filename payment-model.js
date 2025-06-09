const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: [true, 'سفارش الزامی است']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'کاربر الزامی است']
  },
  amount: {
    type: Number,
    required: [true, 'مبلغ پرداخت الزامی است'],
    min: [1000, 'حداقل مبلغ پرداخت 1000 تومان است']
  },
  method: {
    type: String,
    enum: ['zarinpal', 'mellat', 'saman', 'payir', 'idpay', 'cash', 'card_to_card'],
    required: [true, 'روش پرداخت الزامی است']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    sparse: true
  },
  referenceId: {
    type: String
  },
  gatewayData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String
  },
  paidAt: {
    type: Date
  },
  failureReason: {
    type: String
  },
  attempts: {
    type: Number,
    default: 1
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  refund: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed']
    },
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    transactionId: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ order: 1, user: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    minimumFractionDigits: 0
  }).format(this.amount);
});

// Check if payment is successful
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Check if payment can be refunded
paymentSchema.virtual('canRefund').get(function() {
  if (this.status !== 'completed') return false;
  if (this.refund && this.refund.status === 'completed') return false;
  
  // Check if within refund period (e.g., 30 days)
  const refundPeriodDays = 30;
  const daysSincePaid = Math.floor((Date.now() - this.paidAt) / (1000 * 60 * 60 * 24));
  
  return daysSincePaid <= refundPeriodDays;
});

// Generate unique reference ID
paymentSchema.methods.generateReferenceId = function() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  this.referenceId = `PAY-${timestamp}-${randomStr}`.toUpperCase();
  return this.referenceId;
};

// Log payment attempt
paymentSchema.methods.logAttempt = function(ip, userAgent) {
  this.attempts += 1;
  this.ip = ip;
  this.userAgent = userAgent;
  return this.save();
};

// Process refund
paymentSchema.methods.processRefund = async function(amount, reason, userId) {
  if (!this.canRefund) {
    throw new Error('این پرداخت قابل بازپرداخت نیست');
  }
  
  if (amount > this.amount) {
    throw new Error('مبلغ بازپرداخت نمی‌تواند بیشتر از مبلغ پرداخت باشد');
  }
  
  this.refund = {
    status: 'pending',
    amount: amount || this.amount,
    reason,
    refundedBy: userId
  };
  
  this.status = 'refunded';
  await this.save();
  
  return this;
};

// Complete refund
paymentSchema.methods.completeRefund = async function(transactionId) {
  if (!this.refund || this.refund.status !== 'pending') {
    throw new Error('درخواست بازپرداخت یافت نشد');
  }
  
  this.refund.status = 'completed';
  this.refund.refundedAt = new Date();
  this.refund.transactionId = transactionId;
  
  await this.save();
  return this;
};

// Static methods
paymentSchema.statics = {
  // Calculate total revenue
  async calculateRevenue(startDate, endDate) {
    const match = {
      status: 'completed',
      paidAt: { $exists: true }
    };
    
    if (startDate) match.paidAt.$gte = startDate;
    if (endDate) match.paidAt.$lte = endDate;
    
    const result = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          avgPayment: { $avg: '$amount' }
        }
      }
    ]);
    
    return result[0] || {
      totalRevenue: 0,
      totalPayments: 0,
      avgPayment: 0
    };
  },
  
  // Get payment statistics by method
  async getStatsByMethod(startDate, endDate) {
    const match = {
      status: 'completed',
      paidAt: { $exists: true }
    };
    
    if (startDate) match.paidAt.$gte = startDate;
    if (endDate) match.paidAt.$lte = endDate;
    
    return this.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
  },
  
  // Get failed payments
  async getFailedPayments(userId, limit = 10) {
    const query = {
      status: { $in: ['failed', 'cancelled'] }
    };
    
    if (userId) query.user = userId;
    
    return this.find(query)
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .limit(limit);
  }
};

// Middleware to generate reference ID before save
paymentSchema.pre('save', function(next) {
  if (!this.referenceId) {
    this.generateReferenceId();
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;