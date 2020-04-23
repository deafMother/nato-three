// error wrapper function
const catchAsync = fn => {
  return (req, res, next) => {
    // async function returns a promise
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
