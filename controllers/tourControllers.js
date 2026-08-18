// const fs = require("fs");
const { query } = require("express");
const Tour = require("../models/tourModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

const multer = require("multer"); //requiring the multer package
const sharp = require("sharp");

const multerStorage = multer.memoryStorage(); //this way image will be stored as buffer

// 2. File filter (only images)
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

//use storage and filter to create the upload
// const upload = multer({ dest: "public/img/users" });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files.imageCover);//log the uploaded cover image
  if (!req.files.imageCover || !req.files.images) return next();

  //.......1. COVER IMAGE
  //Creates a unique filename
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`); //Saves to disk

  req.body.imageCover = imageCoverFilename; //So the controller knows which file to save in the database

  //........2. IMAGES
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename); //So the controller knows which file to save in the database
    }),
  );
  next();
});

//AS I import the tour model I don't need below
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );
//I NOT LONGER NEED IT AS I'LL WROK WITH IDS THAT COME FROM MONGODB
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   const id = req.params.id * 1;
//   const tour = tours.find((el) => el.id === id);

//   if (!tour) {
//     return res.status(404).json({
//       status: "fail",
//       message: "invalid ID",
//     });
//   }

//   // ✅ ATTACH the tour to req so routes can use it!
//   req.tour = tour;
//   next();
// };
//I NOT LONGER NEED IT AS I'LL WROK WITH IDS THAT COME FROM MONGODB
// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: "fail",
//       message: "Missing name or price",
//     });
//   }
//   next();
// };

// exports.getAllTours = (req, res) => {
//   console.log("req.requestTime:", req.requestTime);

//   res.status(200).json({
//     status: "success",
// restult: tours.length,
// data: {
// tours: tours,
// },
// });
// };

// exports.getAllTours = async (req, res) => {
//   try {
//     console.log("....✨....req.query", req.query);
//     //FILTERING
//     const queryObj = { ...req.query };
//     const excludedFields = ["page", "sort", "limit", "fields"];

//     excludedFields.forEach((el) => delete queryObj[el]);
//     // const tours = await Tour.find(queryObj);

//     //ADVANCED FILTERING
//     // {difficulty: easy, duration: { $gte: 5}} FILTER OBJ
//     // {difficulty: easy, duration: { gte: 5}} QUERY OBJ

//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//     console.log(JSON.parse(queryStr));

//     // const query = Tour.find(queryObj);
//     const query = Tour.find(JSON.parse(queryStr));
//     const tours = await query;

//     //ALL THE TOURS
//     // const tours = await Tour.find();

//     //WAY1
//     // const tours = await Tour.find({ duration: "5", difficulty: "easy" });
//     // const tours = await Tour.find(req.query);

//     //WAY2
//     // const tours = await Tour.find()
//     //   .where("duration")
//     //   .equals(5)
//     //   .where("difficulty")
//     //   .equals("easy");

//     res.status(200).json({
//       status: "success",
//       restult: tours.length,
//       data: {
//         tours: tours,
//       },
//     });
//   } catch (err) {
//     console.log("....✨....req.query", req.query);
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };

// exports.toursFilter = async (req, res) => {
//   try {
//     const {
//       difficulty,
//       minPrice,
//       maxPrice,
//       minRating,
//       duration,
//       maxGroupSize,
//       sortBy,
//       order,
//       page = 1,
//       limit = 10,
//       fields,
//     } = req.query;

//     // 1️⃣ Build the filter
//     const filter = {};
//     if (difficulty) filter.difficulty = difficulty;
//     if (duration) filter.duration = Number(duration);
//     if (maxGroupSize) filter.maxGroupSize = Number(maxGroupSize);

//     // ✅ Fixed: create the object correctly
//     if (minRating) filter.ratingsAverage = { $gte: Number(minRating) };

//     if (minPrice || maxPrice) {
//       filter.price = {};
//       if (minPrice) filter.price.$gte = Number(minPrice);
//       if (maxPrice) filter.price.$lte = Number(maxPrice);
//     }

//     // 2️⃣ Build the query
//     let query = Tour.find(filter);

//     // 3️⃣ Apply sorting
//     if (sortBy) {
//       const sortOrder = order === "desc" ? "-" : "";
//       query = query.sort(`${sortOrder}${sortBy}`);
//     }

//     // 4️⃣ Apply field selection (bonus)
//     if (fields) {
//       const selectedFields = fields.split(",").join(" ");
//       query = query.select(selectedFields);
//     }

//     // 5️⃣ Apply pagination
//     const skip = (Number(page) - 1) * Number(limit);
//     query = query.skip(skip).limit(Number(limit));

//     // 6️⃣ Execute query
//     const tours = await query;

//     res.status(200).json({
//       status: "success",
//       results: tours.length, // ← Fixed: "results" (plural)
//       data: { tours },
//     });
//   } catch (err) {
//     console.error("❌ Error:", err.message);
//     res.status(404).json({
//       status: "fail",
//       message: err.message,
//     });
//   }
// };

// exports.getAllTours = async (req, res) => {
//   try {
//     console.log("....✨....req.query", req.query);
//     //1. FILTERING
//     const queryObj = { ...req.query };
//     const excludedFields = ["page", "sort", "limit", "fields"];

//     excludedFields.forEach((el) => delete queryObj[el]);
//     // const tours = await Tour.find(queryObj);

//     //2. ADVANCED FILTERING
//     // {difficulty: easy, duration: { $gte: 5}} FILTER OBJ
//     // {difficulty: easy, duration: { gte: 5}} QUERY OBJ

//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
//     console.log(JSON.parse(queryStr));

//     // const query = Tour.find(JSON.parse(queryStr));
//     let query = Tour.find(JSON.parse(queryStr));

//     //3. SORTING
//     if (req.query.sort) {
//       const sortBy = req.query.sort.split(",").join(" ");
//       console.log("--🏀--sortBy:", sortBy); //127.0.0.1:8000/api/v1/tours?sort=-price,ratingsAverage
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort("-createdAt");
//     }

//     //4. FIELD LIMITING
//     if (req.query.fields) {
//       const fields = req.query.fields.split(",").join(" ");
//       query = query.select(fields);
//     } else {
//       query = query.select("-__v");
//     }

//     //5.PAGINATION
//     const page = req.query.page * 1 || 1;
//     const limit = req.query.limit * 1 || 100;
//     const skip = (page - 1) * limit;
//     //?page=2&limit=50
//     query = query.skip(skip).limit(limit);

//     if (req.query.page) {
//       const numTours = await Tour.countDocuments();
//       if (skip >= numTours) throw new Error("THIS PAGE DOES NOT EXIST");
//     }

//     const tours = await query;

//     res.status(200).json({
//       status: "success",
//       restult: tours.length,
//       data: {
//         tours: tours,
//       },
//     });
//   } catch (err) {
//     console.log("....✨....req.query", req.query);
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary";
  next();
};

// exports.getAllTours = catchAsync(async (req, res) => {
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const tours = await features.query;
//   res.json({
//     status: "success",
//     results: tours.length,
//     data: { tours },
//   });
// });

exports.getAllTours = factory.getAll(Tour);

// exports.getTour = (req, res) => {
// console.log('req.params', req.params);
// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id === id);
// if (!tour) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'invalid ID',
//   });
// }
//.......
//   res.status(200).json({
//     status: "success",
//     restult: tours.length,
//     data: {
//       // tours: tour,
//       tours: req.tour,
//     },
//   });
// };

// exports.getTour = async (req, res) => {
//   try {
//     const tour = await Tour.findById(req.params.id);
//     //Tour.findOne({_id: req.params.id})
//     res.status(200).json({
//       status: "success",
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };
// exports.getTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findById(req.params.id)
//     .populate({
//       path: "guides",
//       select: "-password -__v", // ← Exclude password and __v
//     })
//     .populate("reviews");
//   //Tour.findOne({_id: req.params.id})

//   if (!tour) {
//     return next(new AppError("NO TOUR FOUND WITH THAT ID", 404));
//     //     ↑
//     //     └── Passes the error object to Express's global error handler
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       tour: tour,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: "reviews" });

//......................................................................................................................
exports.createTour = factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   const newTour = await Tour.create(req.body);
//   res.status(201).json({
//     status: "success",
//     data: {
//       tour: newTour,
//     },
//   });
// });

// //....AFTER ADDING THE MONGO
// exports.createTour = async (req, res, next) => {
//   try {
//     console.log("📦 Received body:", req.body); // ← Add this
//     const newTour = await Tour.create(req.body);
//     console.log("✅ Tour created:", newTour);

//     res.status(201).json({
//       status: "success",
//       data: {
//         tour: newTour,
//       },
//     });
//   } catch (err) {
//     console.error("❌ Error:", err); // ← Log the actual error
//     res.status(400).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };
// exports.createTour = (req, res) => {
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     //201 means created
//     res.status(201).json({
//       status: "success",
//       data: {
//         tour: newTour,
//       },
//     });
//   },
// );
// };

// const catchAsync = (fn) => {
//   //sit until the express calls this anynonmous function assigned to (like exports.createTour) as soon as someone hits the route
//   return (req, res, next) => {
//     fn(req, res, next).catch((err) => next(err));
//   };
// };
///..................................................................................................................................

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError("NO TOUR FOUND WITH THAT ID", 404));
//     //     ↑
//     //     └── Passes the error object to Express's global error handler
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       tour: tour,
//     },
//   });
// });

// exports.updateTour = (req, res) => {
// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id === id);

// if (!tour) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'invalid ID',
//   });
// }
//   res.status(200).json({
//     status: "success",
//     data: {
//       tour: "<something updated...>",
//     },
//   });
// }

// exports.updateTour = async (req, res) => {
//   try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });
//     res.status(200).json({
//       status: "success",
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };

////......................................................................................................................................

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = async (req, res) => {
//   try {
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: "success",
//       data: null,
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: "fail",
//       message: err,
//     });
//   }
// };

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError("NO TOUR FOUND WITH THAT ID", 404));
//     //     ↑
//     //     └── Passes the error object to Express's global error handler
//   }
//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// });

// exports.deleteTour = (req, res) => {
// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id === id);

// if (!tour) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'invalid ID',
//   });
// }
//   res.status(204).json({
//     status: "success",
//     data: null,
//   });
// };

//........AGGREGATION PIPLINE
exports.getToursStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },

      {
        $group: {
          _id: "$difficulty",
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      {
        $match: { _id: { $ne: "easy" } },
      },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    // console.log("🔥 Before aggregation");
    const plan = await Tour.aggregate([
      { $unwind: "$startDates" },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), //the first day of the year
            $lte: new Date(`${year}-12-31`), //the last day of the year
          },
        },
      },
      // 3️⃣ Group by month
      {
        $group: {
          _id: { $month: "$startDates" }, // ← Group by month
          numTourStarts: { $sum: 1 }, // ← Count them
          tours: { $push: "$name" },
        },
      },

      // 4️⃣ Sort by month
      { $sort: { numTourStarts: -1 } }, //← Sorts by number of tours (highest first)

      // 5️⃣ Clean up the output
      {
        $project: {
          _id: 0, // ← Remove this
          month: "$_id", //← Rename _id → month
          numTourStarts: 1, // ← Include this (1 = include)
          tours: 1,
        },
      },
    ]);
    // console.log(".......plan:", plan);
    console.log("✅ After aggregation");

    res.status(200).json({
      status: "success",
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message,
    });
  }
};

// tours-within/:distance/center/:latlng/unit/:unit
// Example: /tours-within/233/center/-40,45/unit/mi

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  // 1. Split latlng into [lat, lng]
  const [lat, lng] = latlng.split(",");

  // 2. Validate coordinates
  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format: lat,lng",
        400,
      ),
    );
  }

  // 3. Convert distance to radians (MongoDB uses radians for geospatial queries)
  // Earth radius: 6378.1 km (or 3963.2 miles)
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  // 4. Find tours within radius
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng * 1, lat * 1], radius],
      },
    },
  });

  // 5. Send response
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// controllers/tourController.js

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  // 1) Split latitude and longitude
  const [lat, lng] = latlng.split(",");

  // 2) Validate coordinates
  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400,
      ),
    );
  }

  // 3) Convert unit to meters (for MongoDB)
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  // 4) MongoDB Aggregation Pipeline
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1], // MongoDB uses [longitude, latitude]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
        spherical: true,
        query: { secretTour: false },
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: distances,
  });
});
