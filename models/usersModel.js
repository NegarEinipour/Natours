const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tell us your name"],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Provide your email"],
    unique: true,
    lowercase: true, //transform the email to lowercase
    validate: [validator.isEmail, "Provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  }, //path to a photo
  password: {
    type: String,
    required: [true, "provide a password"],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, " confirm your password"],
    //THIS ONLY WORKS ON CREATE & SAVE
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "PASSWORDS ARE NOT THE SAME",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// ✅ Pre-save middleware
userSchema.pre("save", async function (next) {
  // 1️⃣ Only run if password is modified
  if (!this.isModified("password")) {
    // return next(); // ✅ Add return to exit early
    return; // ✅ Add return to exit early
  }

  // 2️⃣ Hash the password
  this.password = await bcrypt.hash(this.password, 12);

  // 3️⃣ Remove passwordConfirm (not stored in DB)
  this.passwordConfirm = undefined;

  // next();
});

userSchema.pre("save", async function (next) {
  // 1️⃣ Only run if password is modified AND user is not new
  if (!this.isModified("password") || this.isNew) {
    return;
  }

  // 2️⃣ Set passwordChangedAt (subtract 1 second to be safe)
  this.passwordChangedAt = Date.now() - 1000;
});

// userModel.js

userSchema.pre(/^find/, function (next) {
  // ✅ This runs on all find queries (find, findOne, findById, etc.)
  this.find({ active: { $ne: false } });
  // next();
});

//FOR THE FIRST TIME I'LL CREATE AND INSTANCE METHOD
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Token was issued at: 10:00 (JWTTimestamp = 10:00)
// User changed password at: 12:00 (passwordChangedAt = 12:00)
// JWTTimestamp < changedTimestamp → 10:00 < 12:00 → true
// → Token is invalid → User must log in again ✅

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000, //Convert the date to seconds from miliseconds
      10, //Convert to a number
    );

    // console.log(
    //   "🤬JWTTimestamp/changedTimestamp",
    //   JWTTimestamp,
    //   changedTimestamp,
    // );

    return JWTTimestamp < changedTimestamp; //Check if token was issued BEFORE password change
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // 1️⃣ Generate a random token
  const resetToken = crypto.randomBytes(32).toString("hex"); //	Generates 32 random bytes then Converts it to a hexadecimal string

  // 2️⃣ Hash the token and store it in the database
  this.passwordResetToken = crypto
    .createHash("sha256") //Creates a SHA-256 hashing algorithm
    .update(resetToken) //Feeds the token into the hash
    .digest("hex"); //Converts the hash to a hexadecimal string

  // 3️⃣ Set expiration (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //Adds 10 minutes (10 × 60 seconds × 1000 ms)

  // 4️⃣ Return the un-hashed token (to send to user via email)
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
