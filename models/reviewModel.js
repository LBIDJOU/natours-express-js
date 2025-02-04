const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [
        true,
        'A review must have review title',
      ],
    },
    rating: {
      type: Number,
      min: [
        1,
        'Rating must be greater then or equal to 1',
      ],
      max: [
        5,
        'Rating must be less or aqual to 5',
      ],
    },
    createdAt: {
      type: Date,
      dafault: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [
        true,
        'A review must belong to tour',
      ],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [
        true,
        'A review must belong to user',
      ],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Prevent duplicate reviews
reviewSchema.index(
  { tour: 1, user: 1 },
  { unique: true },
);
// Pre query middleware to populate reviews
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    model: 'User',
    select: 'username photo',
  });
  next();
});

//
reviewSchema.statics.calcAverageRatings =
  async function (tourId) {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId },
      },
      {
        $group: {
          _id: '$tour',
          numRating: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
    ]);
    // console.log('stats:', stats);
    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: stats[0].avgRating,
        ratingsQuantity: stats[0].numRating,
      });
    } else {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsAverage: 4.5,
        ratingsQuantity: 0,
      });
    }
  };

// on save
reviewSchema.post('save', function () {
  // this point to current document
  // constructor is current model constructor
  this.constructor.calcAverageRatings(this.tour);
});

// On delete and update
// retrieve review id and pass it to post middleware
reviewSchema.pre(
  /^findOneAnd/,
  async function (next) {
    //
    this.r = await this.model.findOne(
      this.getFilter(),
    );
    // console.log(this.r);
    next();
  },
);

// Post middleware to call calcAverageRatings
reviewSchema.post(
  /^findOneAnd/,
  async function () {
    await this.r.constructor.calcAverageRatings(
      this.r.tour,
    );
  },
);

const Review = mongoose.model(
  'Review',
  reviewSchema,
);
module.exports = Review;
