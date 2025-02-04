const Review = require('../models/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

// set tour and user id's
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Create a review
exports.createReview = handlerFactory.createOne(Review);
//
exports.getReviewById = handlerFactory.getOne(Review);
// Update review
exports.updateOne = handlerFactory.updateOne(Review);
// Delete review
exports.deleteReview = handlerFactory.deleteOne(Review);
// Get all reviews
exports.getAllReviews = handlerFactory.getAll(Review);

// Get tour reviews
// exports.getTourReviews = catchAsync(async (req, res, next) => {
//   const reviews = await Review.find({ tour: req.params.tourId });
//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
// });
