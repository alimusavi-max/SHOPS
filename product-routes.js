const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('./auth-middleware.js');

// Placeholder for Product Model (in case we need it directly here later)
// const Product = require('./product-model.js');

// Placeholder controller functions
const getAllProducts = (req, res) => {
  res.status(200).json({ message: 'Placeholder: Get All Products', data: [] });
};

const getProductById = (req, res) => {
  res.status(200).json({ message: `Placeholder: Get Product with ID ${req.params.id}`, data: {} });
};

const createProduct = (req, res) => {
  res.status(201).json({ message: 'Placeholder: Create Product', data: req.body });
};

const updateProduct = (req, res) => {
  res.status(200).json({ message: `Placeholder: Update Product with ID ${req.params.id}`, data: req.body });
};

const deleteProduct = (req, res) => {
  res.status(204).json({ message: `Placeholder: Delete Product with ID ${req.params.id}` });
};

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/', protect, restrictTo('admin'), createProduct);
router.patch('/:id', protect, restrictTo('admin'), updateProduct);
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

module.exports = router;
