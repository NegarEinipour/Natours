const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect); // all booking routes require login

router.use(authController.protect);
router.get(
  "/checkout-session/:tourId",
  authController.restrictTo("user"),
  bookingController.getCheckoutSession,
);

module.exports = router; // ← THIS IS CRITICAL
