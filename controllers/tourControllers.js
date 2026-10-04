// controllers/tourController.js
const Tour = require("../models/tourModel");
const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

// SUPABASE CLIENT
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// MULTER CONFIGURATION
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// HELPER: process + upload one image
const processAndUpload = async (buffer, filename, width, height) => {
  // 1) Resize + convert to JPEG in memory
  const processedBuffer = await sharp(buffer)
    .resize(width, height)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  // 2) Upload to Supabase Storage
  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(filename, processedBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    throw new AppError(`Supabase upload failed: ${error.message}`, 500);
  }

  // 3) Return the public URL
  const { data } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
};

// RESIZE + UPLOAD TOUR IMAGES
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files || !req.files.imageCover || !req.files.images) return next();

  // 1) Cover image
  const coverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  req.body.imageCover = await processAndUpload(
    req.files.imageCover[0].buffer,
    coverFilename,
    2000,
    1333,
  );

  // 2) Gallery images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      const url = await processAndUpload(file.buffer, filename, 2000, 1333);
      req.body.images.push(url);
    }),
  );

  next();
});

// ALIAS MIDDLEWARE
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary";
  next();
};

// FACTORY FUNCTIONS
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// TOUR STATS
exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: "$difficulty",
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    { $sort: { avgPrice: 1 } },
    { $match: { _id: { $ne: "easy" } } },
  ]);

  res.status(200).json({
    status: "success",
    data: { stats },
  });
});

// MONTHLY PLAN
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    { $unwind: "$startDates" },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    { $sort: { numTourStarts: -1 } },
    {
      $project: {
        _id: 0,
        month: "$_id",
        numTourStarts: 1,
        tours: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { plan },
  });
});

// TOURS WITHIN RADIUS
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in format: lat,lng",
        400,
      ),
    );
  }

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng * 1, lat * 1], radius],
      },
    },
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: { data: tours },
  });
});

// CALCULATE DISTANCES
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) {
    return next(
      new AppError(
        "Please provide latitude and longitude in format: lat,lng",
        400,
      ),
    );
  }

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
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
