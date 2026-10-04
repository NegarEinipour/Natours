// controllers/bookingController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../models/tourModel");
const Booking = require("../models/bookingModel");
const User = require("../models/usersModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// CHECKOUT SESSION — creates a Stripe session
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    success_url: `${req.protocol}://${req.get("host")}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: tour.price * 100, // Stripe uses cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `https://natours-negar-einipour.onrender.com/img/tours/${tour.imageCover}`,
            ],
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
  });

  // 3) Send session to client
  res.status(200).json({
    status: "success",
    session,
  });
});

// WEBHOOK — creates booking when Stripe confirms payment
const createBookingCheckout = async (session) => {
  console.log("🎯 Webhook fired. session:", {
    tour: session.client_reference_id,
    email: session.customer_email,
    amount: session.amount_total,
  });

  const tour = session.client_reference_id;
  const user = await User.findOne({ email: session.customer_email });
  console.log("👤 User found:", user ? user.email : "NOT FOUND");

  if (!user) throw new Error(`No user with email ${session.customer_email}`);

  const price = session.amount_total / 100;
  const booking = await Booking.create({ tour, user: user.id, price });
  console.log("✅ Booking created:", booking._id);
};

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    await createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

// GET MY BOOKINGS — returns current user's bookings
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
