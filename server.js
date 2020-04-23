const mongoose = require('mongoose');
const dotenv = require('dotenv');

// this is for unahndles sync exceptions
process.on('uncaughtException', err => {
  console.log(err.name, 'uncaughtException  ', err.message, '   BYE BYE !!');
  process.exit(1); // exit the app
});

dotenv.config({
  path: './config.env'
});

const app = require('./app');

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => {
    console.log('Connected');
  });

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log('app unning on port :' + port);
});

//  handle unhadled rejections for async codes
process.on('unhandledRejection', err => {
  console.log(err.name, '  ', err.message, '   BYE BYE !!');
  server.close(() => {
    process.exit(1); // exit the app
  }); // close the server
});
