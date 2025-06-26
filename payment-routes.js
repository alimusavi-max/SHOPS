const express = require('express');
const router = express.Router();
const { protect } = require('./auth-middleware.js'); // Corrected path
const {
  initiatePayment,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
  refundPayment
} = require('./payment-controller.js'); // Corrected path

// All payment routes require authentication
router.use(protect);

// Initiate payment for an order
router.post('/initiate/:orderId', initiatePayment);

// Verify payment (callback from payment gateway)
router.get('/verify', verifyPayment);

// Get payment status
router.get('/status/:paymentId', getPaymentStatus);

// Get user's payment history
router.get('/history', getPaymentHistory);

// Request refund (admin only)
router.post('/refund/:paymentId', protect, refundPayment);

module.exports = router;