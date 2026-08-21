const express = require("express");
const tourController = require("../controllers/tourControllers");
const AuthController = require("../controllers/authController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

// TOUR ROUTES

// Top 5 cheap tours
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Tour statistics
router.route("/tour-stats").get(tourController.getToursStats);

// Monthly plan
router
  .route("/monthly-plan/:year")
  .get(
    AuthController.protect,
    AuthController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan,
  );

// Tours within radius
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

// Distances from a point
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

// Main CRUD routes
router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    AuthController.protect,
    AuthController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.createTour,
  );

router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    AuthController.protect,
    AuthController.restrictTo("admin", "lead-guide"),
    tourController.updateTour,
  )
  .delete(
    AuthController.protect,
    AuthController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour,
  );

// NESTED REVIEW ROUTES
router.use("/:tourId/reviews", reviewRouter);

module.exports = router;
