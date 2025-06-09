const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getAllCampaigns,
  getActiveCampaigns,
  getCampaign,
  getCampaignBySlug,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  pauseCampaign,
  endCampaign,
  getCampaignProducts,
  getCampaignPerformance,
  applyCartCampaigns,
  getUserCampaigns,
  uploadCampaignBanners,
  resizeCampaignBanners
} = require('../controllers/campaign.controller');

// Public routes
router.get('/active', getActiveCampaigns);
router.get('/slug/:slug', getCampaignBySlug);
router.get('/:id/products', getCampaignProducts);

// Protected routes (require authentication)
router.use(protect);

// User routes
router.get('/my-campaigns', getUserCampaigns);
router.post('/apply-to-cart', applyCartCampaigns);

// Admin only routes
router.use(restrictTo('admin'));

// CRUD operations
router
  .route('/')
  .get(getAllCampaigns)
  .post(
    uploadCampaignBanners,
    resizeCampaignBanners,
    createCampaign
  );

router
  .route('/:id')
  .get(getCampaign)
  .patch(
    uploadCampaignBanners,
    resizeCampaignBanners,
    updateCampaign
  )
  .delete(deleteCampaign);

// Campaign actions
router.post('/:id/activate', activateCampaign);
router.post('/:id/pause', pauseCampaign);
router.post('/:id/end', endCampaign);

// Analytics
router.get('/:id/performance', getCampaignPerformance);

module.exports = router;