const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  getAllCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryProducts,
  uploadCategoryImage,
  resizeCategoryImage
} = require('../controllers/category.controller');

// Public routes
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);
router.get('/:id/products', getCategoryProducts);

// Admin only routes
router.use(protect, restrictTo('admin'));

router.post('/', 
  uploadCategoryImage,
  resizeCategoryImage,
  createCategory
);

router.patch('/:id', 
  uploadCategoryImage,
  resizeCategoryImage,
  updateCategory
);

router.delete('/:id', deleteCategory);

module.exports = router;