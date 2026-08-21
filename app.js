const path = require("path");
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const errorController = require("./controllers/errorController");

const viewRouter = require("./routes/viewRoutes");
const userRouter = require("./routes/usersRoutes");
const tourRouter = require("./routes/tourRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/fakeBookingRoutes");

const app = express();

// VIEW ENGINE
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

// SECURITY MIDDLEWARE
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http:", "https:"],
        scriptSrc: ["'self'", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        connectSrc: [
          "'self'",
          "ws:",
          "wss:",
          "https://*.tile.openstreetmap.org",
          "https://cdn.jsdelivr.net",
          "http://localhost:3000",
          process.env.API_URL || "http://localhost:3000",
        ],
      },
    },
  }),
);

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// RATE LIMITING
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, try again in an hour",
});
app.use("/api", limiter);

// BODY PARSERS
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// COOKIE PARSER
app.use(cookieParser());

// DATA SANITIZATION
app.use(mongoSanitize());
app.use(xss());

// PARAMETER POLLUTION PREVENTION
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsAverage",
      "ratingsQuantity",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

// REQUEST TIMESTAMP
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
app.use("/", viewRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// 404 HANDLER
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// GLOBAL ERROR HANDLER
app.use(errorController);

module.exports = app;
