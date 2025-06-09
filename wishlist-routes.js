const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkProductInWishlist,
  moveToCart
} = require('../controllers/wishlist.controller');

// All wishlist routes require authentication
router.use(protect);

// Get user's wishlist
router.get('/', getWishlist);

// Add product to wishlist
router.post('/add/:productId', addToWishlist);

// Remove product from wishlist
router.delete('/remove/:productId', removeFromWishlist);

// Clear entire wishlist
router.delete('/clear', clearWishlist);

// Check if product is in wishlist
router.get('/check/:productId', checkProductInWishlist);

// Move item from wishlist to cart
router.post('/move-to-cart/:productId', moveToCart);

module.exports = router;