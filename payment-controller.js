const axios = require('axios');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// ZarinPal configuration
const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID;
const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX === 'true';
const ZARINPAL_REQUEST_URL = ZARINPAL_SANDBOX 
  ? 'https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentRequest.json'
  : 'https://api.zarinpal.com/pg/rest/WebGate/PaymentRequest.json';
const ZARINPAL_VERIFY_URL = ZARINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentVerification.json'
  : 'https://api.zarinpal.com/pg/rest/WebGate/PaymentVerification.json';
const ZARINPAL_GATEWAY_URL = ZARINPAL_SANDBOX
  ? 'https://sandbox.zarinpal.com/pg/StartPay/'
  : 'https://www.zarinpal.com/pg/StartPay/';

// Initiate payment
exports.initiatePayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  
  // Get order
  const order = await Order.findOne({
    _id: orderId,
    user: req.user.id
  });
  
  if (!order) {
    return next(new AppError('سفارش یافت نشد', 404));
  }
  
  // Check if order is already paid
  if (order.payment.status === 'completed') {
    return next(new AppError('این سفارش قبلا پرداخت شده است', 400));
  }
  
  // Create payment record
  const payment = await Payment.create({
    order: order._id,
    user: req.user.id,
    amount: order.totalAmount,
    method: 'zarinpal',
    description: `پرداخت سفارش #${order.orderNumber}`
  });
  
  // Prepare ZarinPal request
  const zarinpalData = {
    MerchantID: ZARINPAL_MERCHANT_ID,
    Amount: order.totalAmount, // Amount in Tomans
    Description: payment.description,
    Email: req.user.email,
    Mobile: req.user.phone,
    CallbackURL: `${process.env.CLIENT_URL}/payment/verify?paymentId=${payment._id}`
  };
  
  try {
    // Request payment from ZarinPal
    const response = await axios.post(ZARINPAL_REQUEST_URL, zarinpalData);
    
    if (response.data.Status === 100) {
      // Success
      payment.gatewayData = {
        authority: response.data.Authority
      };
      payment.status = 'pending';
      await payment.save();
      
      // Update order payment status
      order.payment.status = 'pending';
      await order.save();
      
      res.status(200).json({
        success: true,
        paymentUrl: `${ZARINPAL_GATEWAY_URL}${response.data.Authority}`,
        authority: response.data.Authority,
        paymentId: payment._id
      });
    } else {
      // Error from ZarinPal
      payment.status = 'failed';
      payment.failureReason = `ZarinPal Error: ${response.data.Status}`;
      await payment.save();
      
      return next(new AppError('خطا در اتصال به درگاه پرداخت', 500));
    }
  } catch (error) {
    payment.status = 'failed';
    payment.failureReason = error.message;
    await payment.save();
    
    return next(new AppError('خطا در پردازش پرداخت', 500));
  }
});

// Verify payment
exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { Authority, Status, paymentId } = req.query;
  
  // Get payment record
  const payment = await Payment.findOne({
    _id: paymentId,
    user: req.user.id
  });
  
  if (!payment) {
    return next(new AppError('اطلاعات پرداخت یافت نشد', 404));
  }
  
  // Get order
  const order = await Order.findById(payment.order);
  
  if (Status !== 'OK') {
    // Payment cancelled by user
    payment.status = 'cancelled';
    payment.failureReason = 'لغو توسط کاربر';
    await payment.save();
    
    return res.redirect(`${process.env.CLIENT_URL}/payment/failed?orderId=${order._id}`);
  }
  
  // Verify with ZarinPal
  const verifyData = {
    MerchantID: ZARINPAL_MERCHANT_ID,
    Authority: Authority,
    Amount: payment.amount
  };
  
  try {
    const response = await axios.post(ZARINPAL_VERIFY_URL, verifyData);
    
    if (response.data.Status === 100 || response.data.Status === 101) {
      // Payment successful
      payment.status = 'completed';
      payment.transactionId = response.data.RefID;
      payment.paidAt = new Date();
      payment.gatewayData = {
        ...payment.gatewayData,
        refId: response.data.RefID,
        cardPan: response.data.CardPan || null
      };
      await payment.save();
      
      // Update order
      order.payment = {
        method: 'online',
        status: 'completed',
        transactionId: response.data.RefID,
        gateway: 'zarinpal',
        amount: payment.amount,
        paidAt: payment.paidAt
      };
      
      // Update order status
      await order.updateStatus('processing', 'پرداخت انجام شد');
      
      // Update product stock
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          await product.sellStock(item.quantity);
        }
      }
      
      // Clear user's cart
      await Cart.findOneAndDelete({ user: req.user.id });
      
      // Send confirmation email
      // await sendOrderConfirmationEmail(order, req.user);
      
      res.redirect(`${process.env.CLIENT_URL}/payment/success?orderId=${order._id}&refId=${response.data.RefID}`);
    } else {
      // Payment verification failed
      payment.status = 'failed';
      payment.failureReason = `Verification failed: ${response.data.Status}`;
      await payment.save();
      
      res.redirect(`${process.env.CLIENT_URL}/payment/failed?orderId=${order._id}`);
    }
  } catch (error) {
    payment.status = 'failed';
    payment.failureReason = error.message;
    await payment.save();
    
    res.redirect(`${process.env.CLIENT_URL}/payment/failed?orderId=${order._id}`);
  }
});

// Get payment status
exports.getPaymentStatus = catchAsync(async (req, res, next) => {
  const payment = await Payment.findOne({
    _id: req.params.paymentId,
    user: req.user.id
  }).populate('order', 'orderNumber totalAmount');
  
  if (!payment) {
    return next(new AppError('اطلاعات پرداخت یافت نشد', 404));
  }
  
  res.status(200).json({
    success: true,
    payment: {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt,
      order: payment.order
    }
  });
});

// Get payment history
exports.getPaymentHistory = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const query = { user: req.user.id };
  if (status) query.status = status;
  
  const payments = await Payment.find(query)
    .populate('order', 'orderNumber totalAmount')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await Payment.countDocuments(query);
  
  res.status(200).json({
    success: true,
    results: payments.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    payments
  });
});

// Refund payment (admin only)
exports.refundPayment = catchAsync(async (req, res, next) => {
  const { reason } = req.body;
  
  const payment = await Payment.findById(req.params.paymentId)
    .populate('order');
  
  if (!payment) {
    return next(new AppError('پرداخت یافت نشد', 404));
  }
  
  if (payment.status !== 'completed') {
    return next(new AppError('فقط پرداخت‌های تکمیل شده قابل بازپرداخت هستند', 400));
  }
  
  if (payment.refund && payment.refund.status === 'completed') {
    return next(new AppError('این پرداخت قبلا بازپرداخت شده است', 400));
  }
  
  // Process refund with ZarinPal (if supported)
  // Note: ZarinPal refund API might require additional setup
  
  // Update payment record
  payment.refund = {
    status: 'completed',
    amount: payment.amount,
    reason: reason,
    refundedAt: new Date(),
    refundedBy: req.user.id
  };
  await payment.save();
  
  // Update order
  const order = payment.order;
  order.payment.status = 'refunded';
  order.payment.refundedAt = new Date();
  order.payment.refundAmount = payment.amount;
  order.payment.refundReason = reason;
  await order.save();
  
  res.status(200).json({
    success: true,
    message: 'بازپرداخت با موفقیت انجام شد',
    refund: payment.refund
  });
});