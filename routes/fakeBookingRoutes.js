// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/fakeBookingController");
const authController = require("../controllers/authController");

// ==============================================
// PROTECTED ROUTES (must be logged in)
// ==============================================
router.use(authController.protect);

// Fake checkout (instantly creates booking)
router.get("/checkout-session/:tourId", bookingController.getCheckoutSession);

// My bookings
router.get("/my-bookings", bookingController.getMyBookings);
router.get("/:id", bookingController.getBooking);

// ==============================================
// ADMIN ROUTES
// ==============================================
router.use(authController.restrictTo("admin", "lead-guide"));

router.route("/").get(bookingController.getAllBookings);

router.route("/:id").patch(bookingController.updateBookingStatus);

module.exports = router;
