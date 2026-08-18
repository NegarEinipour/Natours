const path = require("path");

const express = require("express");
// const fs = require('fs');
const app = express(); ////CREATE FIRST APP
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const userRouter = require("./routes/usersRoutes");
const tourRouter = require("./routes/tourRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");

const errorController = require("./controllers/errorController");

//SERVING STATIC FILES
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//SET SECURITY HTTP HEADER
//As my first middleware
// app.use(helmet());
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
          "ws:", // ← ADD THIS
          "wss:", // ← ADD THIS
          "https://*.tile.openstreetmap.org",
          "https://cdn.jsdelivr.net",
          "http://localhost:3000", // ← For local dev
          process.env.API_URL || "http://localhost:3000",
        ],
      },
    },
  }),
);

//DEVELOPMENT LOGGING
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//LIMIT REQUEST FROM SAME API
//it takes an object of options
//I can define how many request per IP
//100 requests per IP in one hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //allow 100 requests per hour
  message: "Too many requests from this IP, try again in an hour",
});
app.use("/api", limiter);

//BODY PARSER READING DATA FROM THE BODY INTO REQ.BODY
// app.use(express.json());
app.use(express.json({ limit: "10kb" })); //parses the data from the body

app.use(express.urlencoded({ extended: true, limit: "10kb" }));

//COOKIE PARSER
app.use(cookieParser()); //parses the data from the cookie

//DATA SANITIZATION AGAINST NO SQL QUERY INJECTION
app.use(mongoSanitize());

//DATA SANITIZAION AGAINST XSS
app.use(xss());

//PREVENT PARAMETER POLLUTION
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

//TEST MIDDLEWARE
// app.use((req, res, next) => {
//   console.log("from the middleware");
//   next();
// });

//TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log("request.header", req.header);
  // console.log("request.cookies", req.cookies);

  next();
});

// app.get("/", (req, res) => {
//   res.status(200).render("base", {
//     tour: "The Forest Hiker",
//     user: "Jonas",
//   });
// });

// app.get("/overview", (req, res) => {
//   res.status(200).render("overview", {
//     title: "All Tours",
//   });
// });

// app.get("/tour", (req, res) => {
//   res.status(200).render("tour", {
//     title: "The forrest hiker tour",
//   });
// });
app.use("/", viewRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  //way1
  // res.status(404).json({
  //   status: "fail",
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });

  //way2
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = "fail";
  // err.statusCode = 404;
  // next(err);

  //way3
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global Error Handler
app.use(errorController);
// app.use((err, req, res, next) => {
//   console.log("stackTrace:", err.stack);

//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || "error";

//   if (process.env.NODE_ENV === "development") {
//     res.status(err.statusCode).json({
//       status: err.status,
//       error: err,
//       message: err.message,
//       stack: err.stack,
//     });
//   } else if (process.env.NODE_ENV === "production") {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//     });
//   }
// });

// const port = 3000;
// app.listen(port, () => {
//   console.log(`App running on port ${port}`);
// });

module.exports = app;

// // app.get('/', (req, res) => {
// //   //   res.send('server side!');
// //   //   res.status(200).send('server side!');
// //   res.status(404).json({ message: 'server side', app: 'natours' });
// // });

// // app.post('/', (req, res) => {
// //   res.send('You
// // can post to this URL');
// // });
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`),
// );
// // console.log('TOURS:', tours);

// app.get('/api/v1/tours', (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     restult: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

// app.get('/api/v1/tours/:id/:x?', (req, res) => {
//   console.log('req.params', req.params);
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   res.status(200).json({
//     status: 'success',
//     restult: tours.length,
//     data: {
//       tours: tour,
//     },
//   });
// });

// app.post('/api/v1/tours', (req, res) => {
//   // console.log('req.body:', req.body);

//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);
//   tours.push(newTour);
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       //201 means created
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour,
//         },
//       });
//     },
//   );
//   // res.send('DONE!');
// });

// app.patch('/api/v1/tours/:id', (req, res) => {
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<something updated...>',
//     },
//   });
// });
// app.delete('/api/v1/tours/:id', (req, res) => {
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

///////////////////////////////////////////////////////////////////////////

// const getAllTours = (req, res) => {
//   console.log('req.requestTime:', req.requestTime);

//   res.status(200).json({
//     status: 'success',
//     restult: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// };

// const getTour = (req, res) => {
//   console.log('req.params', req.params);
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   res.status(200).json({
//     status: 'success',
//     restult: tours.length,
//     data: {
//       tours: tour,
//     },
//   });
// };

// const createTour = (req, res) => {
//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);
//   tours.push(newTour);
//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       //201 means created
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour,
//         },
//       });
//     },
//   );
// };

// const updateTour = (req, res) => {
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<something updated...>',
//     },
//   });
// };
// const deleteTour = (req, res) => {
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'invalid ID',
//     });
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };

// const getAllUsers = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };
// const getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };
// const createUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };
// const updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };
// const deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not yet defined',
//   });
// };
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id/:x?', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// const tourRouter = express.Router();
// const userRouter = express.Router();

// tourRouter.route('/').get(getAllTours).post(createTour);
// tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

// userRouter.route('/').get(getAllUsers).post(createUser);
// userRouter.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/tours', tourRouter);
