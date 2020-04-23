const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFIeld) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFIeld.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

// user route handler
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.status(500).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: {
      tour: 'Route is not yet implemented completely',
    },
  });
};
exports.getUser = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: {
      tour: 'Route is not yet implemented completely',
    },
  });
};
exports.updateUser = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: {
      tour: 'Route is not yet implemented completely',
    },
  });
};
exports.deleteUser = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: {
      tour: 'Route is not yet implemented completely',
    },
  });
};

// update user data

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user posts passowrd data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('Action not allowed', 400));
  }

  // 2) update the user document

  const fillteredBody = filterObj(req.body, 'name', 'email');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, fillteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// we are simply setting a active propery to false and not deleting the user from the database
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
  });
});

// get the information on a user

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(204).json({
    status: 'success',
    user: req.user,
  });
});
