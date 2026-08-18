const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value `;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError("Invalid Token, log in again", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired, log in again", 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //RENDERED WEBSITE
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        // Stops execution
        status: err.status,
        message: err.message,
      });
    } else {
      console.error("💥ERROR", err);
      return res.status(500).json({
        // Stops execution
        status: "error",
        message: "something went wrong",
      });
    }
  }
  // 'else' HERE!
  else {
    // RENDERED WEBSITE
    if (err.isOperational) {
      return res.status(err.statusCode).render("error", {
        title: "Something went wrong!",
        msg: err.message,
      });
    } else {
      console.error("💥ERROR", err);
      return res.status(500).render("error", {
        title: "Something went wrong",
        msg: "Please try again later",
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  console.log("stackTrace:", err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.log("💘process.env.NODE_ENV", process.env.NODE_ENV);

  if (process.env.NODE_ENV === "development") {
    // res.status(err.statusCode).json({
    //   status: err.status,
    //   error: err,
    //   message: err.message,
    //   stack: err.stack,
    // });

    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    // res.status(err.statusCode).json({
    //   status: err.status,
    //   message: err.message,
    // });

    let error = Object.create(err);
    // This preserves the prototype chain

    if (error.name === "CastError") error = handleCastErrorDB(error); // ← Converts to AppError
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    // // ✅ Log the CONVERTED error's isOperational
    // console.log("🔥 Is operational?", error.isOperational); // ← Fixed

    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
