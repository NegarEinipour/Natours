const Tour = require("../models/tourModel");
const User = require("../models/usersModel");
const Booking = require("../models/fakeBookingModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

// OVERVIEW PAGE
exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();

  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

// TOUR DETAIL PAGE
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    select: "review rating user",
    populate: {
      path: "user",
      select: "name photo",
    },
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name.", 404));
  }

  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

// LOGIN PAGE
exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

// SIGNUP PAGE
exports.getSignupForm = (req, res) => {
  res.status(200).render("signup", {
    title: "Create your account",
  });
};

// ACCOUNT PAGE
exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

// UPDATE USER DATA (Form submission)
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});

// MY TOURS (Bookings)
exports.getMyTours = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  const tourIDs = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});
