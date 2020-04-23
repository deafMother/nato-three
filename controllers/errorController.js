const AppError = require('../utils/appError');

const handleCatErroDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    err
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    res.status(500).json({
      status: 'error',
      messsage: 'Something went very wrong'
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log('Error handled');
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // in production
    let error = { ...err };
    if (err.name === 'CastError') {
      error = handleCatErroDB(error);
    } // we can create similarly error regarding to particular error types

    sendErrorProd(errror, res);
  }
};
