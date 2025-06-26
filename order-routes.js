const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('./auth-middleware.js');

const orderController = require('./order-controller.js');

// User routes (require login)
router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrderById); // This controller checks user ownership or admin role

// Admin routes (require admin role)
// These could also be mounted under a dedicated /admin/orders router if preferred,
// but for now, keeping them here with a prefix in the path is fine.
router.get('/admin/all', protect, restrictTo('admin'), orderController.getAllOrdersAdmin);

// Admin get specific order - uses the same getOrderById controller, which handles admin access
router.get('/admin/:id', protect, restrictTo('admin'), orderController.getOrderById);

router.patch('/admin/:id/status', protect, restrictTo('admin'), orderController.updateOrderStatusAdmin);


module.exports = router;
