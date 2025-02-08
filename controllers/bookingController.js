const stripe = require('stripe')(
  process.env.STRIPE_SECRET_KEY,
);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
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
        // success_url: `${req.protocol}://${req.get('host')}/my-booked-tours/?tour=${tourId}&user=${req.user.id}&price=${bookedTour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-booked-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookedTour.slug}`,
        customer_email: req.user.email,
        client_reference_id: tourId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${bookedTour.name} Tour`,
                description: bookedTour.summary,
                images: [
                  `${req.protocol}://${req.get('host')}/img/tours/${bookedTour.imageCover}`,
                ],
              },
              unit_amount: bookedTour.price * 100,
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
// exports.createBookingCheckout = catchAsync(
//   // This is only TEMPORARY, because it's UNSECURE. Everyone can make bookings without paying
//   async (req, res, next) => {
//     const { tour, user, price } = req.query;
//     if (!tour || !user || !price) return next();

//     await Booking.create({
//       tour,
//       user,
//       price,
//     });
//     res.redirect(req.originalUrl.split('?')[0]);
//   },
// );

//
const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const userDoc = await User.findOne({
    email: session.customer_email,
  });
  const user = userDoc ? userDoc.id : null;
  // Retrieve line items to get the price
  const lineItems =
    await stripe.checkout.sessions.listLineItems(
      session.id,
    );
  const price =
    lineItems.data[0].price_data.unit_amount /
    100;
  await Booking.create({ tour, user, price });
};

exports.webhookChekout = async (
  req,
  res,
  next,
) => {
  const signature =
    req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res
      .status(400)
      .send(`Webhook error : ${error.message}`);
  }
  if (
    event.type === 'checkout.session.completed'
  ) {
    createBookingCheckout(
      event.data.object,
    ).catch((err) =>
      res
        .status(400)
        .send(`Webhook error : ${err.message}`),
    );
  }
  res.status(200).json({ received: true });
};

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
