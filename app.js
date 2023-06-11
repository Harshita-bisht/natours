const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//require('events').EventEmitter.defaultMaxListeners = 15;

const appError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const app = express();

//1) GLOBAL MIDDLEWARE
//set security HTTP headers
app.use(helmet());

//development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP , please try again in an hour!'
});
app.use('/api', limiter);

//body parser,reading data from the body into req.body
app.use(express.json({ limit: '10kb' })); //limiting data that goes in with body

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]//list where we allow duplicates
  })
);

//serving static files
app.use(express.static(`${__dirname}/public`));

// app.use((req,res,next)=>{
//   console.log('Hello from the middleware');
//   next();
// });

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRoutes);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status:'fail',
  //   message:`Can't find ${req.originalUrl} on this server!`
  // });

  // const err=new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status='fail';
  // err.statusCode=404;

  next(new appError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
