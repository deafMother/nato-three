const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  // generate token
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
  return token;
};

// send token in a cookie
// we  use this function to send token in a  cookie
const sendTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 2 * 60 * 1000), // 90 days from now
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; //send only in encrypted connection i.e https if true
  }

  res.cookie('jsonwebtokennatours', token, cookieOptions);
};

// sign up
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  // generate token
  const token = signToken(newUser._id);

  sendTokenCookie(res, token);

  // remove the password from the output
  newUser.password = undefined;

  res.status(201).json({
    status: 'Success',
    token,
    data: {
      user: newUser
    }
  });
});

// login

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check if email and passowrd exists
  if (!email || !password) {
    return next(new AppError('Invalid login credentials', 400));
  }
  // 2. check if user exists and the password is corrent
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid login credentials', 401));
  }

  const correct = await user.correctPassword(password, user.password);

  if (!correct) {
    return next(new AppError('Invalid login credentials', 401));
  }

  // 3. send token to client
  const token = signToken(user._id);

  sendTokenCookie(res, token);

  res.status(200).json({
    status: 'success',
    token
  });
});

// middleware function to protect routes, check token

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Get the token and check if its exists.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to gain access', 401)
    );
  }

  // 2) validate the token
  // jtw.verify takes a third argument which is a call back function but in the case we will prosimy it using a wrapper function
  const decodedPayload = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  const { id } = decodedPayload;

  // 3) check if user still exists
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User deleted for this token', 401));
  }

  // 4) check if the user changed the password after the token was issued
  if (user.changePasswordAfter(decodedPayload.iat)) {
    return next(
      new AppError('Token invalid please login in to get new token', 401)
    );
  }

  req.user = user;

  next();
});

// restrict middleware, to restrice depending on the user roles

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    // roles is an array.
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 401)
      );
    }
    next();
  });
};

// password forgot features.

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user for the given email ', 404));
  }

  // 2)) generate random  reset token

  const resetToken = user.createPasswordResetToken();

  // since we are changing only one two filed and not all so we need to deactive the validators
  await user.save({ validateBeforeSave: false });

  // 3)) send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v2/users/resetPassword/${resetToken}`;

  const message = `Forgot password? Submit a patch req with new password and password confirm to the ${resetURL}. 
  If you didnt forget password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: ' Your password reset token(valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent ot email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was na error sending the email.', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });

  // 2) if token hs not expired and there is user, set the new password

  if (!user) {
    return next(new AppError('Invalid toke or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3) update the changePassowrdAt property fot the user

  // 4) log the user in, send the token
  const token = signToken(user._id);

  sendTokenCookie(res, token);

  res.status(200).json({
    status: 'success',
    token
  });
});

// cahnge/update password by a user, this is not forgot password

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the user from the database
  const user = await User.findById(req.user._id).select('+password');

  // 2) check if current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Ypur current password is wrong', 401));
  }

  // 3) update the password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4) log the user in, send the token
  const token = signToken(user._id);

  sendTokenCookie(res, token);

  res.status(200).json({
    status: 'success',
    token
  });
});
