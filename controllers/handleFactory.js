// we are generalizing the base functions, this is not being implemented in this app but can be done

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No doc found with that id', 404));
    }
    res.status(204).json({
      status: 'success'
    });
  });
