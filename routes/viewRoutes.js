const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");

const router = express.Router();

// PUBLIC ROUTES
router.get("/", authController.isLoggedin, viewsController.getOverview);
router.get("/tour/:slug", authController.isLoggedin, viewsController.getTour);
router.get("/login", authController.isLoggedin, viewsController.getLoginForm);
router.get("/signup", viewsController.getSignupForm);

// PROTECTED ROUTES
router.get("/me", authController.protect, viewsController.getAccount);
router.get("/my-tours", authController.protect, viewsController.getMyTours);

module.exports = router;
