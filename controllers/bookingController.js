const stripe = require('stripe')(
  process.env.STRIPE_SECRET_KEY,
);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handlerfactory = require('./handlerFactory');

exports.createCheckoutSession = catchAsync(
  async (req, res, next) => {
    // 1-> Find the booked tour
    const { tourId } = req.params;
    const bookedTour =
      await Tour.findById(tourId);
    if (!bookedTour) {
      return next(
        new AppError(
          'Tour not found! Or invalid tourId',
          404,
        ),
      );
    }
    // 2-> Create a checkout session
    const session =
      await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${tourId}&user=${req.user.id}&price=${bookedTour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookedTour.slug}`,
        customer_email: req.user.email,
        client_reference_id: tourId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: bookedTour.price * 100,
              product_data: {
                name: `${bookedTour.name} Tour`,
                description: bookedTour.summary,
                images: [
                  `https://natours.dev/img/tours/${bookedTour.imageCover}`,
                ],
              },
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
      });
    // 3-> Create a session response
    res.status(200).json({
      status: 'success',
      session,
    });
  },
);

//
exports.createBookingCheckout = catchAsync(
  // This is only TEMPORARY, because it's UNSECURE. Everyone can make bookings without paying
  async (req, res, next) => {
    const { tour, user, price } = req.query;
    if (!tour || !user || !price) return next();

    await Booking.create({
      tour,
      user,
      price,
    });
    res.redirect(req.originalUrl.split('?')[0]);
  },
);

// Get all bookings
exports.getAllBookings =
  handlerfactory.getAll(Booking);
exports.getBookingById =
  handlerfactory.getOne(Booking);
exports.createBooking =
  handlerfactory.createOne(Booking);
exports.deleteBooking =
  handlerfactory.deleteOne(Booking);
exports.updateBooking =
  handlerfactory.updateOne(Booking);
