const express = require('express');
const router = express.Router();
const { protect } = require('./auth-middleware.js'); // Corrected path
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  syncCart
} = require('./cart-controller.js'); // Corrected path

// All cart routes require authentication
router.use(protect);

// Get user's cart
router.get('/', getCart);

// Add item to cart
router.post('/add', addToCart);

// Update cart item quantity
router.put('/item/:productId', updateCartItem);

// Remove item from cart
router.delete('/item/:productId', removeFromCart);

// Clear entire cart
router.delete('/clear', clearCart);

// Sync cart (merge local and server cart)
router.post('/sync', syncCart);

module.exports = router;