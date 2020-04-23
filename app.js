const express = require('express');
const app = express();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const reviewRouter = require('./routes/reviewRoutes');

// helmet: for security
app.use(helmet());

// rate limiter, depending on ip: for security
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 100 request from the same ip in 1 hour
  message: 'Too many reequest from this ip please try again in an hour'
});
app.use('/api', limiter);

// body parser
app.use(express.json({ limit: '10kb' })); // set the size limit for the body as well

// sanitize data against noSql injection and against cross site scripting attacks: for security
app.use(mongoSanitize());
app.use(xss());
// prevent parameter pollution i.e remove duplicate paramaters: for security
app.use(
  hpp({
    whitelist: 'duration' // duplicates for these  will not be prevented
  })
);

//  serving static files
app.use(express.static(__dirname + '/public'));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(req.method + ' : ' + req.url);
    //console.log(req.headers);
    next();
  });
}

// routers

app.use('/api/v2/tours', tourRouter);
app.use('/api/v2/users', userRouter);
app.use('/api/v2/reviews', reviewRouter);

//  handle unhandled routes
app.all('*', (req, res, next) => {
  // if the next function receives an argument then express automatically knowns that it is an error,
  // all middlewares are then skipped and the error handling middleware deals with it
  next(new AppError(` Cant find ${req.originalUrl} on the server`, 404));
});

//  middleware to handle global errors
// error handling middleware has four arguments
app.use(globalErrorHandler);

module.exports = app;
