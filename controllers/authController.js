const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/usersModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendCreateToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true, //the cookie will be send on an encrypted connection
    httpOnly: true, //the cookie can't be accessed or modified by the browser
    sameSite: "lax", // ← Add this
    path: "/", // ← Add this
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("token", token, cookieOptions);

  //REMOVE THE PASSWORD FROM THE OUTPUT
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // res.status(200).json({
  //   status: "success",
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });

  const url = `${req.protocol}://${req.get("host")}`;

  await new Email(newUser, url).sendWelcome(); //sendWeleome is an async

  sendCreateToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. CHECK IF EMAIL AND PASSWORD EXIST
  if (!email || !password) {
    return next(new AppError("Provide email and password", 400));
  }

  //2. IF THE USER EXIST && THE PASSWORD IS CORRECT
  //Includes the password field	By default, password is hidden (select: false)
  // const user = User.findOne({email: email})
  //3 compare the passwords
  // correctPassword is an async function so I have to await it
  const user = await User.findOne({ email }).select("+password");
  const correct = await user.correctPassword(password, user.password);

  // ❌ If user doesn't exist → send error
  if (!user || !correct) {
    return next(new AppError("Invalid email or password", 401));
  }

  // //4. creating the token
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // //3. IF EVERYTING IS OK SEND THE TOKEN TO THE CLIENT
  // res.status(200).json({
  //   status: "success",
  //   token,
  // });

  // 3) If everything ok, send token to client
  sendCreateToken(user, 200, res);
});

// Logout - Clear the JWT cookie
exports.logout = catchAsync(async (req, res, next) => {
  // Send a new cookie with the same name, but with an expired date
  res.cookie("token", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000), // 10 seconds
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully!",
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // // 🛑 DEBUG: Check what's arriving
  // console.log("🔍 Headers:", req.headers);
  // console.log("🔍 Cookies:", req.cookies);

  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    // console.log("✅ Token from headers:", token);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    // console.log("✅ Token from cookies:", token);
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError("User recently changed password! Please log in again.", 401),
  //   );
  // }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// ✅ This works — factory function returns middleware
exports.restrictTo = (...roles) => {
  // roles ['admin', 'lead-guide']
  return (req, res, next) => {
    // This is the actual middleware
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission", 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // console.log("📧 Received email:", req.body.email); // ← Add this
  // console.log("📧 Type:", typeof req.body.email); // ← Add this

  // 1️⃣ Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with that email", 404));
  }

  // 2️⃣ Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    // 3️⃣ Send it back as an email
    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\n
    // If you didn't forget your password, please ignore this email.`;

    // Skip email for testing
    // console.log("📧 Would have sent email to:", user.email);
    // console.log("🔑 Reset token:", resetToken);
    // console.log("📧 Attempting to send email to:", user.email);
    // await sendEmail({
    //   email: req.body.email,
    //   subject: "Your password reset token (valid for 10 min)",
    //   message,
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    console.log("❌ Email Error Details:", err); // ← ADD THIS
    console.log("❌ REAL EMAIL ERROR:", err);
    console.log("❌ ERROR MESSAGE:", err.message);
    console.log("❌ ERROR STACK:", err.stack);

    // 4️⃣ If the email fails, clean up the token
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // 5️⃣Send an error response
    return next(
      new AppError(
        "There was an error sending the email. Try again later.",
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log("🔥 resetPassword controller called!"); // ← Add this

  // 1️⃣ GET USER BASED ON THE TOKEN
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token) // "/resetPassword/:token"
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2️⃣ IF TOKEN HAS NOT EXPIRED AND THERE IS A USER -> SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password; //The new password the user sent
  user.passwordConfirm = req.body.passwordConfirm; //The confirmation of the new password

  // 3️⃣ UPDATE THE CHANGEDPASSWORDAT FOR THE CURRENT USER
  user.passwordResetToken = undefined; //Removes the token so it can't be used again
  user.passwordResetExpires = undefined; //Removes the expiration date

  await user.save(); //Saves the changes to the database

  // // 4️⃣ LOG THE USER IN → SEND THE JWT TOKEN
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // res.status(200).json({
  //   status: "success",
  //   token,
  // });
  sendCreateToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1️⃣ GET THE USER FROM COLLECTION
  //req.user.id is the Logged-In User's ID
  const user = await User.findById(req.user.id).select("+password");

  // 2️⃣ CHECK IF THE POSTED CURRENT PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }

  // 3️⃣ IF SO, UPDATE THE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // // 4️⃣ LOG THE USER IN -> SEND THE JWT
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  // res.status(200).json({
  //   status: "success",
  //   token,
  // });

  sendCreateToken(user, 200, res);
});

// ONLY FOR RENDERED PAGES, NO ERRORS
exports.isLoggedin = async (req, res, next) => {
  // console.log("🔍 ========== isLoggedin ==========");
  // console.log("🔍 Cookies received:", req.cookies);
  // console.log("🔍 req.cookies.jwt:", req.cookies?.token); // ← CHANGE 'token' TO 'jwt'

  // console.log("🔍 Request body:", req.body);

  const { email, password } = req.body;
  // console.log("📧 Email received:", email);
  // console.log("🔑 Password received:", password);

  // 1) Check if cookie exists
  if (req.cookies && req.cookies.token) {
    // ← CHANGE 'token' TO 'jwt'
    // console.log("✅ JWT cookie found!");
    try {
      // 2) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.token, // ← CHANGE 'token' TO 'jwt'
        process.env.JWT_SECRET,
      );
      console.log("✅ Token verified:", decoded);

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        console.log("❌ User not found in database");
        return next();
      }
      console.log("✅ User found:", currentUser.name);

      // 4) Check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        console.log("❌ Password changed after token issued");
        return next();
      }

      // 5) Grant access — user is logged in
      req.user = currentUser;
      res.locals.user = currentUser;
      console.log("✅ res.locals.user set!");
      return next();
    } catch (err) {
      // console.log("❌ Token verification failed:", err.message);
      return next();
    }
  }

  // console.log("❌ No JWT cookie found");
  next();
};
