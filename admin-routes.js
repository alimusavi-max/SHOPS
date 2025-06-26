const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('./auth-middleware.js');

// Example: Admin Dashboard Route (protected)
router.get('/', protect, restrictTo('admin'), (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Admin Dashboard (Placeholder)',
    user: req.user // User info from 'protect' middleware
  });
});

// In the future, other admin-specific routes can be added here
// or mounted from other route files if they are purely admin-focused.
// For example:
// const adminUserRoutes = require('./admin-user-routes.js');
// router.use('/users', protect, restrictTo('admin'), adminUserRoutes);

// For now, product management routes with admin protection are in product-routes.js.
// Order management admin routes will be in order-routes.js or here.

module.exports = router;
