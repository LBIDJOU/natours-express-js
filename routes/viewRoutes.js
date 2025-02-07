const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Routes for views
// router.use(authController.isLoggedIn);

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverviewPage,
);
router.get(
  '/tour/:slug',
  authController.isLoggedIn,
  viewController.getTour,
);
router.get(
  '/register',
  authController.isLoggedIn,
  viewController.getRegisterForm,
);
router.get(
  '/login',
  authController.isLoggedIn,
  viewController.getLoginForm,
);
router.get(
  '/my-account',
  authController.authGuard,
  viewController.getAccount,
);

router.post(
  '/submit-user-data',
  authController.authGuard,
  viewController.updateUserData,
);
router.get(
  '/my-booked-tours',
  // bookingController.createBookingCheckout,
  authController.authGuard,
  viewController.getMyBookedTours,
);

router.get(
  '/forgot-password',
  viewController.getForgotPasswordPage,
);

router.get(
  '/reset-password/:token',
  viewController.getResetPasswordForm,
);

module.exports = router;
