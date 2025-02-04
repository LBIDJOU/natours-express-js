const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [
      true,
      'Please tell us your username',
    ],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [
      validator.isEmail,
      'Invalid email! Please try again with a valid one.',
    ],
  },
  role: {
    type: String,
    enum: [
      'user',
      'guide',
      'lead-guide',
      'admin',
    ],
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [
      true,
      'Please submit your password',
    ],
    validate: [
      validator.isStrongPassword,
      'Please provide a strong password!',
    ],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [
      true,
      'Please confirm your password',
    ],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords do not match!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Pre-Middleware to hash user password before save it to db
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(
    this.password,
    salt,
  );
  this.confirmPassword = undefined;
  next();
});

//
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew)
    return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
//
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});
// // Create an instance method to verify password
userSchema.methods.correctPassword =
  async function (
    condidatePassword,
    userPassword,
  ) {
    return await bcrypt.compare(
      condidatePassword,
      userPassword,
    );
  };

userSchema.methods.changedPasswordAfter =
  function (JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10,
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  };

userSchema.methods.createPasswordResetToken =
  function () {
    const resetToken = crypto
      .randomBytes(32)
      .toString('hex');
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    // console.log(
    //   { resetToken },
    //   this.passwordResetToken,
    // );
    this.passwordResetExpires =
      Date.now() + 10 * 60 * 1000;
    return resetToken;
  };

const User = mongoose.model('User', userSchema);
module.exports = User;
