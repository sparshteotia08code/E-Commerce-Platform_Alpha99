const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.post('/verify-email', authController.verifyEmail);
router.post('/social-login', authController.socialLogin);
router.post('/addresses', protect, authController.addAddress);
router.delete('/addresses/:id', protect, authController.removeAddress);

module.exports = router;
