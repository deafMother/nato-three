const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name']
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    lowercase: true, // transform the value to lowercase
    validate: [validator.isEmail, 'Not valid email']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'guide', 'lead-guide'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide Password'],
    minlength: 6,
    select: false // when fetching this field will be excluded however when new docs are created it will be available in the response
  },
  photo: {
    // the users photo will be stored in the filesystem and a path to that photo will be saved here as a string
    type: String
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please provide a password'],
    validate: {
      // this only works on new doc creation !!
      validator: function(value) {
        return value === this.password;
      },
      message: 'Password not matching'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// crypt the password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined; // now the passwordConfirm will not persist in the database
  next();
});

//

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// instance method: will be available on all doc of a particular collection
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // 'this' will refer to the current doc but those fileds that have selected:false cannot be accessed

  return await bcrypt.compare(candidatePassword, userPassword);
};

// check if the user has changed the passoerd after the token has been issued in which cas the user must request for new token and the old token should be invalid
userSchema.methods.changePasswordAfter = function(JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTtimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypt the token, and save to the database, similar to saving the encrypted password in the db
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, { encryptedToked: this.passwordResetToken });

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins from now

  return resetToken;
};

// query middleware

userSchema.pre(/^find/, function(next) {
  // 'this' points to the current query
  this.find({ active: { $ne: false } });
  next();
});

module.exports = mongoose.model('User', userSchema);
