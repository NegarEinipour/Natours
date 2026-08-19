const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId, // ← Capital 'O' in ObjectId
    ref: "Tour",
    required: [true, "Booking must belong to a tour"],
  },
  user: {
    type: mongoose.Schema.ObjectId, // ← Capital 'O' in ObjectId
    ref: "User",
    required: [true, "Booking must belong to a user"], // ← "user" not "tour"
  },
  price: {
    type: Number,
    required: [true, "Booking must have a price"], // ← required (with 'd')
  },
  createdAt: {
    type: Date,
    default: Date.now, // ← No parentheses! (reference, not execution)
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function () {
  this.populate("user").populate({
    path: "tour",
    select: "name",
  });
});

const Booking = mongoose.model("Booking", bookingSchema); // ← Capital 'B'

module.exports = Booking; // ← Capital 'B'
