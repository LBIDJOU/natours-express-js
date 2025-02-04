const AppError = require('../utils/appError');

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      staus: err.status,
      error: err,
      message: err.message,
      stackTrace: err.stack,
    });
  }
  // RENDRED WEBSITE
  console.log('Error ...', err);
  return res
    .status(err.statusCode)
    .render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
};

const sendErrorProd = (err, req, res) => {
  // Operational errors trusted:send back details to client
  //API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        staus: err.status,
        message: err.message,
      });
      // Programming or unknown errors:don't send details to client
    }
    // Log the error
    console.error('Error: ', err);
    // Send the generic message
    return res.status(500).json({
      status: 'error',
      message: 'Oops Something went wrong!',
    });
  }

  // RENDRED WEBSITES
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  } else {
    // Programming or unknown errors:don't send details to client
    // Log the error
    console.error('Error: ', err);
    // Send the generic message
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: 'Please try again later',
    });
  }
};

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path} with value ${err.value}`;
  return new AppError(message, 400);
};
const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map(
    (error) => error.message,
  );
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleDuplicatedFieldDb = (err) => {
  const value = err.message.match(
    /(["'])(?:(?=(\\?))\2.)*?\1/,
  )[0];
  const message = `Duplicated field ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError(
    'Invalid! Please try to log in.',
    401,
  );

const handleExpiredToken = () =>
  new AppError(
    'Your token has been expired! Please try to log in again.',
    401,
  );
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  //
  if (process.env.NODE_ENV === 'production') {
    let error = {
      ...err,
      name: err.name,
      message: err.message,
    };
    if (error.name === 'CastError')
      error = handleCastErrorDb(error);
    if (error.code === 11000)
      error = handleDuplicatedFieldDb(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDb(error);
    if (err.name === 'JsonWebTokenError')
      error = handleJwtError();
    if (err.name === 'TokenExpiredError')
      error = handleExpiredToken();
    sendErrorProd(error, req, res);
  } else if (
    process.env.NODE_ENV === 'development'
  ) {
    sendErrorDev(err, req, res);
  }
};
