const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// this is a query middleware
reviewSchema.pre(/^find/, function (next) {
  this.find()
    .populate({
      path: 'tour',
      select: 'name',
    })
    .populate({
      path: 'user',
      select: 'name photo',
    });
  next();
});

// static method on the model
reviewSchema.statics.calcAverageRatinsg = async function (tourId) {
  // here 'this' points to the review model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  // persists these values into the tour
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].averageRating,
  });
};

// this has to be created before the model
reviewSchema.post('save', function () {
  // this is the current review document
  this.constructor.calcAverageRatinsg(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
