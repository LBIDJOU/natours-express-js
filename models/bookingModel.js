const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [
      true,
      'Booking must belong to tour',
    ],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [
      true,
      'Booking must belong to user',
    ],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.find()
    .populate({
      path: 'tour',
      model: 'Tour',
      select: 'name',
    })
    .populate({
      path: 'user',
      model: 'User',
    });
  next();
});

const Booking = mongoose.model(
  'Booking',
  bookingSchema,
);
module.exports = Booking;
