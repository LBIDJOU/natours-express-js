const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverviewPage = catchAsync(
  async (req, res, next) => {
    // Get all the tours data from collection
    const tours = await Tour.find();
    // Build template
    // Render the template
    res.status(200).render('overview', {
      title: 'All tours',
      tours,
    });
  },
);

exports.getTour = catchAsync(
  async (req, res, next) => {
    // Get tour from collection
    const { slug } = req.params;
    const tour = await Tour.findOne({
      slug,
    }).populate({
      path: 'reviews',
      model: 'Review',
      select: 'rating review user',
    });
    if (!tour)
      return next(
        new AppError(
          'No tour not found! with that name',
          404,
        ),
      );
    res.status(200).render(`tour`, {
      title: `${tour.name} Tour`,
      tour,
    });
  },
);

//
exports.getRegisterForm = (req, res) => {
  res.status(200).render('register', {
    title: 'Create an account',
  });
};
//
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

//
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account',
  });
};

//
exports.updateUserData = catchAsync(
  async (req, res, next) => {
    const { username, email } = req.body;
    const updatedUser =
      await User.findByIdAndUpdate(
        req.user.id,
        { username, email },
        { new: true, runValidators: true },
      );
    res.status(200).render('account', {
      title: 'My Account',
      user: updatedUser,
    });
  },
);

// Get my booking page
exports.getMyBookedTours = catchAsync(
  async (req, res, next) => {
    // 1-> Get all bookings from collection
    const bookings = await Booking.find({
      user: req.user.id,
    });
    const bookedToursIds = bookings.map(
      (el) => el.tour.id,
    );
    const bookedTours = await Tour.find({
      _id: { $in: bookedToursIds },
    });
    // 2-> Render my bookings page
    res.status(200).render('overview', {
      title: 'My bookings',
      tours: bookedTours,
    });
  },
);

//
exports.getForgotPasswordPage = (req, res) => {
  // Render forgot password page
  res.status(200).render('forgotPassword', {
    title: 'Forgot Password',
  });
};
//
exports.getResetPasswordForm = (req, res) => {
  const { token } = req.params;
  // Render forgot password page
  res.status(200).render('resetPassword', {
    title: 'Reset Password',
    token,
  });
};
