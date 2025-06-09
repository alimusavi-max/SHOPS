const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
  markHelpful,
  reportReview,
  uploadReviewImages,
  resizeReviewImages
} = require('../controllers/review.controller');

// Get all reviews for a product
router.get('/product/:productId', getProductReviews);

// Get specific review
router.get('/:id', getReview);

// Protected routes
router.use(protect);

// Get user's reviews
router.get('/user/my-reviews', getUserReviews);

// Create review (must be authenticated)
router.post('/product/:productId', 
  uploadReviewImages,
  resizeReviewImages,
  createReview
);

// Update review (only by owner)
router.patch('/:id', 
  uploadReviewImages,
  resizeReviewImages,
  updateReview
);

// Delete review (only by owner or admin)
router.delete('/:id', deleteReview);

// Mark review as helpful
router.post('/:id/helpful', markHelpful);

// Report review
router.post('/:id/report', reportReview);

// Admin routes
router.use(restrictTo('admin'));

// Get all reviews (admin only)
router.get('/', getAllReviews);

module.exports = router;