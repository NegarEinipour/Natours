// routes/bookingRoutes.js
const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

const router = express.Router();

// All booking routes require login
router.use(authController.protect);

// Checkout session — only regular "user" role can book tours
router.get(
  "/checkout-session/:tourId",
  authController.restrictTo("user"),
  bookingController.getCheckoutSession,
);

// My bookings
router.get("/my-bookings", bookingController.getMyBookings);

// Get a single booking by ID
router.get("/:id", bookingController.getBooking);

// ADMIN ROUTES (everything below requires admin/lead-guide)
router.use(authController.restrictTo("admin", "lead-guide"));

router.route("/").get(bookingController.getAllBookings);

router.route("/:id").patch(bookingController.updateBookingStatus);

module.exports = router;
