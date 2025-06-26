const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('./auth-middleware.js');

const productController = require('./product-controller.js');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes - protected and restricted to admin role
router.post('/', protect, restrictTo('admin'), productController.createProduct);
router.patch('/:id', protect, restrictTo('admin'), productController.updateProduct);
router.delete('/:id', protect, restrictTo('admin'), productController.deleteProduct);

// TODO: Consider routes for managing product reviews if they are a separate sub-resource,
// e.g., POST /:productId/reviews (user)
// GET /:productId/reviews (public)
// DELETE /:productId/reviews/:reviewId (admin or review owner)
// The current product model embeds reviews, but also has methods on Product to add reviews.
// If reviews are managed through product methods, these routes might not be separate.

module.exports = router;
