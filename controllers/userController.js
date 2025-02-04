const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
//     cb(
//       null,
//       `user-${req.user.id}-${file.fieldname}-${uniqueSuffix}`,
//     );
//   },
// });

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

// Upload user photo
exports.uploadUserPhoto = upload.single('photo');

//
const filterObj = (obj, ...allowedFields) => {
  const filterObject = {};
  Object.keys(obj).forEach((key) => {
    if (allowedFields.includes(key)) {
      filterObject[key] = obj[key];
    }
  });
  return filterObject;
};
// Routes handlers
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message:
      'This route is not yet defined! please use signup one',
  });
};
// Hanlde uers routes
exports.getAllUsers = handlerFactory.getAll(User);

// Resize user
exports.resizeUserPhoto = catchAsync(
  async (req, res, next) => {
    if (!req.file) return next();
    const uniqueSuffix = `${req.file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpeg`;
    req.file.filename = `user-${req.user.id}-${uniqueSuffix}`;
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(
        `public/img/users/${req.file.filename}`,
      );
    next();
  },
);
// Update profile
exports.updateMe = catchAsync(
  async (req, res, next) => {
    // 1) Create error if user try to update password
    if (
      req.body.password ||
      req.body.confirmPassword
    ) {
      return next(
        new AppError(
          'This route is not for password updates! Please hit /update-my-password route',
          400,
        ),
      );
    }

    // 2) Update user document
    const filtredBody = filterObj(
      req.body,
      'username',
      'email',
    );
    if (req.file)
      filtredBody.photo = req.file.filename;
    const updatedUser =
      await User.findByIdAndUpdate(
        req.user.id,
        filtredBody,
        { new: true, runValidators: true },
      );
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  },
);
// Delete current user
exports.deleteMe = catchAsync(
  async (req, res, next) => {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        active: false,
      },
    );
    if (!user) {
      return next(
        new AppError('No user found!', 404),
      );
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  },
);

//
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
//
exports.getUserById = handlerFactory.getOne(User);
// Do not update password using this
exports.updateUser =
  handlerFactory.updateOne(User);
// delete user
exports.deleteUser =
  handlerFactory.deleteOne(User);
