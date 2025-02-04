const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const modelDoc = await Model.findByIdAndDelete({
      _id: id,
    });
    if (!modelDoc)
      return next(
        new AppError('No document not found with that ID!', 404),
      );
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

//
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const modelDoc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!modelDoc)
      return next(
        new AppError('No document found with that ID!', 404),
      );
    res.status(200).json({
      status: 'success',
      data: {
        data: modelDoc,
      },
    });
  });
//
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

//
exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);
    if (populateOptions) query = query.populate(populateOptions);
    const modelDoc = await query;
    if (!modelDoc)
      return next(
        new AppError('No document found with that ID!', 404),
      );
    res.status(200).json({
      status: 'success',
      data: {
        data: modelDoc,
      },
    });
  });

//
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // 1- features
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // Execute query
    // const modelDocs = await features.query.explain();
    const modelDocs = await features.query;
    // Send the response
    res.status(200).json({
      status: 'success',
      results: modelDocs.length,
      data: {
        data: modelDocs,
      },
    });
  });
