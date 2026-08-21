const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// INDEXES
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// QUERY MIDDLEWARE — Populate User
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name",
  });
});

// STATIC METHOD — Calculate Average Ratings
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: "$tour",
        nRatings: { $sum: 1 },
        aveRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].aveRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// POST SAVE — Update Average Ratings
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.tour);
});

// FIND ONE AND UPDATE — Update Average Ratings
reviewSchema.pre(/^findOneAndUpdate/, async function () {
  this.reviewDoc = await this.model.findOne(this.getFilter());
});

reviewSchema.post(/^findOneAndUpdate/, async function () {
  if (this.reviewDoc) {
    await this.reviewDoc.constructor.calcAverageRatings(this.reviewDoc.tour);
  }
});

// FIND ONE AND DELETE — Update Average Ratings
reviewSchema.pre(/^findOneAndDelete/, async function () {
  this.r = await this.model.findOne(this.getFilter());
});

reviewSchema.post(/^findOneAndDelete/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
