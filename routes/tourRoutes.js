const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const reviewRouter = require('./viewRoutes');

const router = express.Router();

// Param middleware
// router.param('id', tourController.checkId);

// POST /tours/34/reviews
// GET /tours/34/reviews

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(
    tourController.aliasTopTours,
    tourController.getAllTours,
  );

router
  .route('/tour-stats')
  .get(tourController.getToursStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.authGuard,
    authController.restrictTo(
      'admin',
      'lead-guide',
      'guide',
    ),
    tourController.getMonthlyPlan,
  );
router
  .route(
    '/tours-within/:distance/center/:latlng/unit/:unit',
  )
  .get(tourController.getToursWithin);

// Or /tours-distance?distance=22&center=lat,lng&unit=km
// Vs /tours-within/22/cente/lat,lng/unit/km --> standred

//
router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getToursDistances);
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.authGuard,
    authController.restrictTo(
      'admin',
      'lead-guide',
    ),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTourById)
  .patch(
    authController.authGuard,
    authController.restrictTo(
      'admin',
      'lead-guide',
    ),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.authGuard,
    authController.restrictTo(
      'admin',
      'lead-guide',
    ),
    tourController.deleteTour,
  );

module.exports = router;
