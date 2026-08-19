const Tour = require("../models/tourModel");
const User = require("../models/usersModel");
const Bookings = require("../models/fakeBookingModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. GET ALL THE TOUR DATA FROM COLLECTION
  const tours = await Tour.find();
  //2. BUILD TEMPLATE

  //3. RENDER THAT TEMPLATE USING THE TOUR DATA FROM 1

  res.status(200).render("overview", {
    title: "All Tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1. GET THE DATA FOR THE REQUESTED TOUR (INCLUDING REVIEWS AND GUIDES)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    //You're using populate to replace the reviews IDs with the actual review documents from the database.
    path: "reviews",
    select: "review rating user",
    populate: {
      path: "user",
      select: "name photo", // ← This gets the user data!
    },
  });

  if (!tour) {
    return next(new AppError("There is no tour with that name.", 404));
  }

  //2. BUILD THE TEMPLATE

  //3. RENDER THE DATA FROM 1
  res.status(200).render("tour", {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
});

// controllers/viewsController.js
exports.getSignupForm = (req, res) => {
  res.status(200).render("signup", {
    title: "Create your account",
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

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

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings for the current user
  const bookings = await Bookings.find({ user: req.user.id });

  // 2) Extract tour IDs from the bookings
  const tourIDs = bookings.map((booking) => booking.tour);

  // 3) Find all tours with those IDs
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  // 4) Render the page with tours
  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});
