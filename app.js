const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

// Start express app
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Implement CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://natours-express-js.onrender.com',
];
app.use(
  cors({
    origin: function (origin, cb) {
      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        cb(null, true);
      } else {
        cb(
          new Error(
            'Your are not allowed by CORS',
          ),
        );
      }
    },
    credentials: true,
  }),
);

// Serving static files
app.use(
  express.static(path.join(__dirname, 'public')),
);

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://js.stripe.com',
          'https://cdn.maptiler.com',
          'blob:',
        ],
        workerSrc: ["'self'", 'blob:'],
        connectSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://api.stripe.com',
          'https://cdn.maptiler.com',
          'https://api.maptiler.com',
        ],
        frameSrc: [
          "'self'",
          'https://js.stripe.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://*.mapbox.com',
          'https://api.maptiler.com', // ✅ Allow MapTiler images
        ],
      },
    },
  }),
);

// Log the current node env
// console.log(process.env.NODE_ENV);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookChekout,
);

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message:
    'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  }),
);
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);
// Compression text data
app.use(compression());
// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!`,
      404,
    ),
  );
});

app.use(globalErrorHandler);

module.exports = app;
