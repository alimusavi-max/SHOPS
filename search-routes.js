const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const multer = require('multer');

// Configure multer for image upload (visual search)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط فایل‌های تصویری مجاز هستند'), false);
    }
  }
});

// Search products
router.get('/products', optionalAuth, searchController.searchProducts);

// Get search suggestions
router.get('/suggestions', searchController.getSearchSuggestions);

// Get available filters
router.get('/filters', searchController.getSearchFilters);

// Search by barcode
router.get('/barcode/:barcode', searchController.searchByBarcode);

// Voice search
router.post('/voice', optionalAuth, searchController.voiceSearch);

// Visual search (search by image)
router.post('/visual', 
  optionalAuth, 
  upload.single('image'), 
  searchController.visualSearch
);

module.exports = router;