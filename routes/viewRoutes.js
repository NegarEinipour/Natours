const express = require("express");
const router = express.Router();
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");

// router.use(authController.isLoggedin);

router.get("/", authController.isLoggedin, viewsController.getOverview);

router.get("/tour/:slug", authController.isLoggedin, viewsController.getTour);
// router.get("/tour", viewsController.getTour);

router.get("/login", authController.isLoggedin, viewsController.getLoginForm);
router.get("/signup", viewsController.getSignupForm);
router.get("/me", authController.protect, viewsController.getAccount);

router.get("/my-tours", authController.protect, viewsController.getMyTours);

// router.post(
//   "/submit-user-data",
//   authController.protect,
//   viewsController.updateUserData,
// );

module.exports = router;
