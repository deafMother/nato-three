const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
dotenv.config({
  path: '../../config.env'
});

// reading json file
const tours = JSON.parse(fs.readFileSync('./tours.json', 'utf-8'));

// import data into database

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('data successfully loaded to database');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

//  delete all data from database

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('data successfully deleted from database');
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => {
    console.log('Connected');
    if (process.argv[2] === '--import') {
      importData();
    } else if (process.argv[2] === '--delete') {
      deleteData();
    }
  });
