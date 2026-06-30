const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.get('/', productController.getProducts);
router.get('/brands', productController.getBrands);
router.get('/:id', productController.getProductById);
router.post('/:id/reviews', protect, productController.addProductReview);
router.get('/:id/recommendations', productController.getProductRecommendations);

module.exports = router;
