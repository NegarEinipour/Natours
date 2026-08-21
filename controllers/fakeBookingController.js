// controllers/bookingController.js
const Tour = require("../models/tourModel");
const Booking = require("../models/fakeBookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// FAKE CHECKOUT SESSION (No real payment)
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  // SIMULATE PAYMENT — instantly create booking
  const booking = await Booking.create({
    tour: tour.id,
    user: req.user.id,
    price: tour.price,
    status: "confirmed",
    paid: true,
    createdAt: Date.now(),
  });

  // // Send success response
  // res.status(200).json({
  //   status: "success",
  //   message: "🎉 Booking confirmed! (Demo mode)",
  //   data: {
  //     booking,
  //     tour: tour.name,
  //     price: tour.price,
  //   },
  // })
  // 3) Redirect to my

  res.redirect("/my-tours");
});

// GET MY BOOKINGS
exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id })
    .populate("tour", "name slug imageCover price")
    .sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

// GET SINGLE BOOKING
exports.getBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("tour", "name slug imageCover")
    .populate("user", "name email");

  if (!booking) {
    return next(new AppError("No booking found with that ID", 404));
  }

  if (booking.user.id !== req.user.id && req.user.role !== "admin") {
    return next(
      new AppError("You do not have permission to view this booking", 403),
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      booking,
    },
  });
});

// ADMIN: GET ALL BOOKINGS
exports.getAllBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find()
    .populate("tour", "name price")
    .populate("user", "name email");

  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: {
      bookings,
    },
  });
});

// ADMIN: UPDATE BOOKING STATUS
exports.updateBookingStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!booking) {
    return next(new AppError("No booking found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      booking,
    },
  });
});
