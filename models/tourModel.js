const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
//
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [
        30,
        'A tour name must have less or equal than 30 characters',
      ],
      minlength: [
        10,
        'A tour name must have more or equal than 10 characters',
      ],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain characters',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [
        true,
        'A tour must have a duration',
      ],
    },
    maxGroupSize: {
      type: Number,
      required: [
        true,
        'A tour must have a group size',
      ],
    },
    difficulty: {
      type: String,
      required: [
        true,
        'A tour must have a difficulty',
      ],
      enum: {
        values: ['easy', 'difficult', 'medium'],
        message:
          'Difficulty either:easy, medium or difficult!',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [
        true,
        'A tour must have a price',
      ],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // This only points to current document on NEW document creation
          return this.price > val;
        },
        message:
          'Price must be above priceDiscount ({VALUE})!',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [
        true,
        'A tour must have a summary',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [
        true,
        'A tour must have a cover image',
      ],
    },
    images: [String],
    createsAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // GeoJSON
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Create index to improve read performance
// single index field
// tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// Compound indexing
tourSchema.index({
  price: 1,
  ratingsAverage: -1,
});
// Document middleware: Runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true,
  });
  next();
});

//
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(
//     async (id) => await User.findById(id),
//   );
//   this.guides = [...(await Promise.all(guidesPromises))];
//   next();
// });
// tourSchema.pre('save', function (next) {
//   console.log('Will saved...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query Middleware
// tourSchema.pre('find', function (next)
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find().populate({
    path: 'guides',
    model: 'User',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(
//     `Query tooks ${Dat
// e.now() - this.start} milliseconds to be executed`,
//   );
//   // console.log(docs);
//   next();
// });

// Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({
//     $match: { secretTour: { $ne: true } },
//   });
//   console.log(this.pipeline());
//   next();
// });

// Virual property
tourSchema
  .virtual('duartionWeeks')
  .get(function () {
    return this.duration / 7;
  });

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
