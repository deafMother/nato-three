const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a price'],
      unique: [true, 'A tour must be unique'],
      trim: true,
      maxlength: [50, 'Cannot be so long... make it short punk'],
      minlength: [10, 'What! make it longer']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must havea a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must havea a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can be: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be aboce 1'],
      max: [5, ' cannot exceed 5']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 4.4,
      min: 4
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          // this kind of  validator functions which uses 'this' will not work on updates but only on new creation of documents
          // i.e the 'this'   is only accessible on new doc creation
          return val < this.price;
        },
        message: 'Discount ({value}) cannot be greater than the price' // this is the error message
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: {
      type: [String]
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false // always exclude from access in the query
    },
    startDates: [Date],
    slug: {
      type: String
    },
    startLocation: {
      // geoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      addrss: String,
      description: String
    },
    locations: [
      // geoJSON
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        addrses: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

// virtual property, virtual properties cannot be used in queries
tourSchema.virtual('durationWeeks').get(function() {
  // this points to the current document
  return this.duration / 7;
});

// virtual populate, for virtual properties
// here we are specifying the reference
// the populate command has to be executed in the query like for any normal field
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// mongoose middleware, runs before the .save() and .create() but not in .insertMany() and update();
tourSchema.pre('save', function(next) {
  // adding a new property, it has to defined in the database
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function(next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id));

//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// this is a query middleware
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-_v -passwordChangedAt'
  });

  next();
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
