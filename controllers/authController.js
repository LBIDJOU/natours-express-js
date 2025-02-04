const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// Generate jwt token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (
  user,
  statusCode,
  res,
  req
) => {
  user.password = undefined;
  const token = generateToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN *
          24 *
          60 *
          60 *
          1000,
    ),
    httpOnly: true,
    sameSite:
      process.env.NODE_ENV === 'production'
        ? 'None'
        : 'Lax',
  };
  if(req.secure) cookieOptions.secure = true
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    access_token: token,
    data: user,
  });
};

// Sign up handler
exports.signUp = catchAsync(
  async (req, res, next) => {
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      photo: req.body.photo,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      role: req.body.role,
    });
    const url = `${req.protocol}://${req.get('host')}/my-account`;
    // console.log(url);
    await new Email(user, url).sendWelcome();
    createAndSendToken(user, 201, res,req);
  },
);

exports.logIn = catchAsync(
  async (req, res, next) => {
    const { email, password } = req.body;
    // Check if ther is email and password
    if (!email || !password) {
      return next(
        new AppError(
          'Please provide email and password!',
        ),
        400,
      );
    }
    // Check if user exist && password is correct
    const user = await User.findOne({
      email,
    }).select('+password');
    if (
      !user ||
      !(await user.correctPassword(
        password,
        user.password,
      ))
    ) {
      return next(
        new AppError(
          'Incorrect email or password!',
          401,
        ),
      );
    }
    // Send back token to the client
    createAndSendToken(user, 200, res,req);
  },
);

// Log out
exports.logOut = (req, res) => {
  res.cookie('jwt', 'logged-out-yeah', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.authGuard = catchAsync(
  async (req, res, next) => {
    // 1) Getting the token and check if its there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] ===
        'Bearer'
    ) {
      token =
        req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          'You are not logged in! Please try to log in.',
          401,
        ),
      );
    }
    // 2) Verify the token
    const payload = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET,
    );
    // 3) Check if the user with this token is still exist
    const currentUser = await User.findById(
      payload.id,
    );

    if (!currentUser)
      return next(
        new AppError(
          'The user belonging to this token does not longer exist!',
          401,
        ),
      );
    // 4) Check if the user change his password after the token was issued
    if (
      currentUser.changedPasswordAfter(
        payload.iat,
      )
    ) {
      return next(
        new AppError(
          'User recently change password!  Please log in again',
          401,
        ),
      );
    }
    // Grant access to the user
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  },
);

// Check if user is logged in
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting the token and check if its there
  if (req.cookies.jwt) {
    try {
      // 2) Verify the token
      const payload = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      // 3) Check if the user with this token is still exist
      const currentUser = await User.findById(
        payload.id,
      );
      if (!currentUser) return next();
      // 4) Check if the user change his password after the token was issued
      if (
        currentUser.changedPasswordAfter(
          payload.iat,
        )
      ) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
    } catch (error) {
      return next();
    }
  }
  next();
};

// Authorization
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action!',
          403,
        ),
      );
    }
    next();
  };

// Password functionality
exports.forgotPassword = async (
  req,
  res,
  next,
) => {
  // 1) Get user based on posted email
  const user = await User.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(
      new AppError(
        'No user found with this email!',
        404,
      ),
    );
  }
  // 2) Generate the random reset token
  const resetToken =
    user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it back to user's email
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
    await new Email(
      user,
      resetURL,
    ).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'email send to user!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false,
    });
    return next(
      new AppError(
        'Error during sending email!. Please try again.',
        500,
      ),
    );
  }
};
exports.resetPassword = catchAsync(
  async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    // 2) If the token has not expired, and there is user, set the new password
    if (!user) {
      return next(
        new AppError(
          'Token is invalid or expired!',
          400,
        ),
      );
    }
    user.password = req.body.password;
    user.confirmPassword =
      req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Update the passwordChangedAt field
    // 4) Log in the user by sending JWT token
    createAndSendToken(user, 200, res,req);
  },
);

// Update password functionality
exports.updatePassword = catchAsync(
  async (req, res, next) => {
    // 1) Get the current log in user
    const user = await User.findById(
      req.user.id,
    ).select('+password');
    // 2) Check if the password POSTED by the user is the same as the current one
    if (
      !user ||
      !(await user.correctPassword(
        req.body.currentPassword,
        user.password,
      ))
    ) {
      return next(
        new AppError(
          'Incorrect current password!',
          401,
        ),
      );
    }
    // 3) Update the password
    user.password = req.body.password;
    user.confirmPassword =
      req.body.confirmPassword;
    await user.save();
    // 4) Update passwordChangedAt('auto') field && and log in the user again by sending JWT token
    createAndSendToken(user, 200, res,req);
  },
);
