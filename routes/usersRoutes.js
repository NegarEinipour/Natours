const express = require("express");
// const multer = require("multer");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");

// const upload = multer({ dest: "public/img/users" });
const router = express.Router();

// ==============================================
// PUBLIC ROUTES (No authentication required)
// ==============================================
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// ==============================================
// PROTECTED ROUTES (Authentication required)
// ==============================================
router.use(authController.protect); // ✅ All routes below are protected

// Update password
router.patch("/updatePassword", authController.updatePassword);

// Self-management
router.get("/me", userController.getMe, userController.getUser);
// router.patch("/updateMe", upload.single("photo"), userController.updateMe);
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete("/deleteMe", userController.deleteMe);

// ==============================================
// ADMIN ROUTES (Authentication + Authorization)
// ==============================================
router.use(authController.restrictTo("admin")); // ✅ Only admins can access below

// Admin user management
router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    // authController.protect is already applied via router.use()
    // authController.restrictTo("admin", "lead-guide") is already applied
    // ✅ You can just use the controller directly
    userController.deleteUser,
  );

module.exports = router;
