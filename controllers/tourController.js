const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const handlerFactory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  const fileType = file.mimetype.split('/')[0];
  if (fileType === 'image') {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Not an image! Please upload only images',
        400,
      ),
      false,
    );
  }
};
//
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
//
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
//- upload.single('photo') req.file
//- upload.array('images',12) req.files
//
const processImage = async (image, req) => {
  const uniqueSuffix = `${image.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpeg`;
  const filename = `tour-${req.params.id}-${uniqueSuffix}`;
  await sharp(image.buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${filename}`);
  return filename;
};

//
exports.resizeTourImages = catchAsync(
  async (req, res, next) => {
    if (
      !req.files.imageCover ||
      !req.files.images
    )
      return next();
    // 1-) Cover image
    const imageCover = await processImage(
      req.files.imageCover[0],
      req,
    );
    req.body.imageCover = imageCover;
    // 2-) Tour images
    req.body.images = await Promise.all(
      req.files.images.map(
        async (image) =>
          await processImage(image, req),
      ),
    );
    next();
  },
);
//
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields =
    'name,price,ratingsAverage,summary,difficulty';
  next();
};

// routes for tours
//
exports.getAllTours = handlerFactory.getAll(Tour);
//
exports.getTourById = handlerFactory.getOne(
  Tour,
  {
    path: 'reviews',
    model: 'Review',
    select: '-__v',
  },
);

exports.createTour =
  handlerFactory.createOne(Tour);
exports.updateTour =
  handlerFactory.updateOne(Tour);
exports.deleteTour =
  handlerFactory.deleteOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   // Create a new tour
//   // const newTour = new Tour({});
//   // newTour.save();
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tours: newTour,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const { id } = req.params;
//   const tour = await Tour.findByIdAndDelete({
//     _id: id,
//   });
//   if (!tour)
//     return next(new AppError('No tour not found with that ID!', 404));
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.getToursStats = catchAsync(
  async (req, res) => {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: {
            $sum: '$ratingsQuantity',
          },
          avgRatings: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } },
      // },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  },
);

exports.getMonthlyPlan = catchAsync(
  async (req, res) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  },
);

// Get tours within a distance
// Vs /tours-within/22/center/:latlng/unit/km --> standred
exports.getToursWithin = catchAsync(
  async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude coordinates! like this lat,lng.',
          400,
        ),
      );
    }
    const radius =
      unit === 'mi'
        ? distance / 3963.2
        : distance / 6378.1;
    const tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [
            [lng * 1, lat * 1],
            radius,
          ],
        },
      },
    });
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours,
      },
    });
  },
);

//
exports.getToursDistances = catchAsync(
  async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier =
      unit === 'mi' ? 0.000621371 : 0.001;
    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude coordinates! like this lat,lng.',
          400,
        ),
      );
    }
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1],
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        data: distances,
      },
    });
  },
);
