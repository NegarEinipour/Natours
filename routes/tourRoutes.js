const express = require("express");
const tourController = require("../controllers/tourControllers");
const AuthController = require("./../controllers/authController");
// const reviewController = require("./../controllers/reviewController");
const reviewRouter = require("./../routes/reviewRoutes");
// const fs = require('fs');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
// );

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

const router = express.Router();

// router.route('/').get(getAllTours).post(createTour);
// router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

// router.param('id', (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   next();
// });
//I NOT LONGER NEED IT AS I'LL WROK WITH IDS THAT COME FROM MONGODB
// router.param('id', tourController.checkID);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getToursStats);
router
  .route("/monthly-plan/:year")
  .get(
    AuthController.protect,
    AuthController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan,
  );

// GET / api / v1 / tours / search;
// router.route("/filter").get(tourController.toursFilter);

// ✅ CORRECT - Chain .get() after .route()
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);
// /tour-distance/233/center/-40,45/unit/mi

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);
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
// .post(tourController.checkBody, tourController.createTour); //mongoose take care of it
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

router.use("/:tourId/reviews", reviewRouter);

module.exports = router;
