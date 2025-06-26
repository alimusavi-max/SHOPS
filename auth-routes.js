const express = require('express');
const authController = require('./auth-controller.js');
const { protect, loginLimiter, createAccountLimiter, passwordResetLimiter } = require('./auth-middleware.js'); // Assuming limiters are exported if used

const router = express.Router();

// Public routes
router.post('/register', createAccountLimiter, authController.register); // Added createAccountLimiter
router.post('/login', loginLimiter, authController.login); // Added loginLimiter
router.get('/logout', authController.logout); // Or POST if preferred, controller handles cookie clearing

router.post('/refresh-token', authController.refreshToken);

router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword); // Added passwordResetLimiter
router.patch('/reset-password/:token', authController.resetPassword);

router.get('/verify-email/:token', authController.verifyEmail);

router.post('/send-phone-otp', authController.sendPhoneOTP); // Consider rate limiting
router.post('/verify-phone', authController.verifyPhone);   // Consider rate limiting

// Protected routes (user must be logged in)
router.use(protect); // All routes below this will be protected

router.get('/me', authController.getMe);
router.patch('/update-password', authController.updatePassword);

// Example of a protected route if needed for other user actions:
// router.get('/my-profile-details', authController.someOtherUserSpecificHandler);

module.exports = router;
