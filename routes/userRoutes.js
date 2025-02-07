const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.logIn);
router.post(
  '/forgot-password',
  authController.forgotPassword,
);
router.patch(
  '/reset-password/:token',
  authController.resetPassword,
);
router.get('/logout', authController.logOut);

// Protect all routes after this middleware using authGuard
router.use(authController.authGuard);

router.patch(
  '/update-my-password',
  authController.updatePassword,
);

router.patch(
  '/update-my-profile',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

router.delete(
  '/delete-my-account',
  userController.deleteMe,
);

router.get(
  '/me',
  userController.getMe,
  userController.getUserById,
);

//
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
