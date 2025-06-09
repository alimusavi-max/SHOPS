const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'محصول الزامی است']
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'تعداد باید حداقل 1 باشد']
  },
  color: String,
  size: String
});

const shippingAddressSchema = new mongoose.Schema({
  receiver: {
    type: String,
    required: [true, 'نام گیرنده الزامی است']
  },
  phone: {
    type: String,
    required: [true, 'شماره تماس الزامی است']
  },
  province: {
    type: String,
    required: [true, 'استان الزامی است']
  },
  city: {
    type: String,
    required: [true, 'شهر الزامی است']
  },
  address: {
    type: String,
    required: [true, 'آدرس الزامی است']
  },
  postalCode: {
    type: String,
    required: [true, 'کد پستی الزامی است']
  }
});

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['online', 'cash', 'card', 'transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  gateway: String,
  amount: Number,
  paidAt: Date,
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'سفارش باید متعلق به یک کاربر باشد']
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pending',      // در انتظار پرداخت
      'processing',   // در حال پردازش
      'packaged',     // بسته‌بندی شده
      'shipped',      // ارسال شده
      'delivered',    // تحویل شده
      'cancelled',    // لغو شده
      'returned'      // مرجوع شده
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  payment: paymentSchema,
  shippingAddress: shippingAddressSchema,
  shippingMethod: {
    type: String,
    enum: ['normal', 'express', 'scheduled'],
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  trackingCode: String,
  subtotal: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  coupon: {
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: String,
  customerNotes: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  returnedAt: Date,
  returnReason: String,
  invoice: {
    number: String,
    issuedAt: Date,
    url: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Generate unique order number
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Find the last order of today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const lastOrder = await this.findOne({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  }).sort('-orderNumber');
  
  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `ORD-${year}${month}${day}-${sequence.toString().padStart(4, '0')}`;
};

// Pre-save middleware
orderSchema.pre('save', async function(next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    this.orderNumber = await this.constructor.generateOrderNumber();
  }
  
  // Add initial status to history
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      note: 'سفارش ایجاد شد'
    });
  }
  
  // Calculate totals
  let subtotal = 0;
  let totalDiscount = 0;
  
  this.items.forEach(item => {
    const itemSubtotal = item.price * item.quantity;
    const itemDiscount = (item.price * item.discount / 100) * item.quantity;
    
    subtotal += itemSubtotal;
    totalDiscount += itemDiscount;
    
    item.finalPrice = item.price - (item.price * item.discount / 100);
  });
  
  this.subtotal = subtotal;
  this.totalDiscount = totalDiscount;
  
  // Apply coupon discount
  if (this.coupon && this.coupon.code) {
    if (this.coupon.type === 'percentage') {
      const couponDiscount = (subtotal - totalDiscount) * (this.coupon.discount / 100);
      this.totalDiscount += couponDiscount;
    } else {
      this.totalDiscount += this.coupon.discount;
    }
  }
  
  // Calculate total amount
  this.totalAmount = this.subtotal - this.totalDiscount + this.shippingCost;
  
  next();
});

// Update status
orderSchema.methods.updateStatus = async function(newStatus, note, userId) {
  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['packaged', 'cancelled'],
    packaged: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`انتقال از وضعیت ${this.status} به ${newStatus} مجاز نیست`);
  }
  
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note,
    updatedBy: userId
  });
  
  // Set specific timestamps
  switch (newStatus) {
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
    case 'returned':
      this.returnedAt = new Date();
      break;
  }
  
  // Update product stock
  if (newStatus === 'cancelled' || newStatus === 'returned') {
    const Product = mongoose.model('Product');
    
    for (const item of this.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock.quantity += item.quantity;
        product.stock.sold = Math.max(0, product.stock.sold - item.quantity);
        await product.save();
      }
    }
  }
  
  return this.save();
};

// Process payment
orderSchema.methods.processPayment = async function(paymentData) {
  this.payment.status = 'completed';
  this.payment.transactionId = paymentData.transactionId;
  this.payment.gateway = paymentData.gateway;
  this.payment.amount = paymentData.amount;
  this.payment.paidAt = new Date();
  
  // Update order status
  if (this.status === 'pending') {
    await this.updateStatus('processing', 'پرداخت انجام شد');
  }
  
  return this.save();
};

// Cancel order
orderSchema.methods.cancel = async function(reason, userId) {
  if (['delivered', 'cancelled', 'returned'].includes(this.status)) {
    throw new Error('امکان لغو این سفارش وجود ندارد');
  }
  
  this.cancelReason = reason;
  await this.updateStatus('cancelled', reason, userId);
  
  // Process refund if payment was completed
  if (this.payment.status === 'completed') {
    this.payment.status = 'refunded';
    this.payment.refundedAt = new Date();
    this.payment.refundAmount = this.payment.amount;
    this.payment.refundReason = reason;
  }
  
  return this.save();
};

// Return order
orderSchema.methods.return = async function(reason, userId) {
  if (this.status !== 'delivered') {
    throw new Error('فقط سفارشات تحویل شده قابل مرجوع هستند');
  }
  
  const deliveryDate = new Date(this.deliveredAt);
  const daysSinceDelivery = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceDelivery > 7) {
    throw new Error('مهلت مرجوع کردن سفارش (7 روز) به پایان رسیده است');
  }
  
  this.returnReason = reason;
  await this.updateStatus('returned', reason, userId);
  
  // Process refund
  if (this.payment.status === 'completed') {
    this.payment.status = 'refunded';
    this.payment.refundedAt = new Date();
    this.payment.refundAmount = this.payment.amount;