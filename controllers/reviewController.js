const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

const factory = require('../controllers/handleFactory.js');

exports.getAllReview = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();
  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  req.body.user = req.user.id;
  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});

// the generic version of delete is used this method of implementation is not necessary but is possible
exports.deleteReview = factory.deleteOne(Review);
