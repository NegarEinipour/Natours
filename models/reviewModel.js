const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty"],
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
      required: [true, "Review must belong to a user "],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, // ✅ Also good to include
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: "tour",
  //     select: "name",
  //   }).populate({
  //     path: "user",
  //     select: "name",
  //   });

  this.populate({
    path: "user",
    select: "name",
  });
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //this points to the model   this' = Review model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // ← Only reviews for this tour
    },
    {
      $group: {
        _id: "$tour", // ← Group by tour ID
        nRatings: { $sum: 1 }, // ← Count the reviews
        aveRating: { $avg: "$rating" }, // ← Average the ratings
      },
    },
  ]);

  // console.log("📊 Aggregation result:", stats);
  // stats = [ { _id: 'tour123', nRatings: 3, avgRating: 4.7 } ]

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

reviewSchema.post("save", function () {
  //this points to current review
  // //that function is availabe on mode
  // Review.calcAverageRatings(this.tour);
  this.constructor.calcAverageRatings(this.tour);
});

//.................................DELETE AND UPDATE.................................

///..................UPDATE middleware
//the goal is to get access to current review document
//this keyword is the current query
//I can execute the query then get the document
// Works with Mongoose 7+
reviewSchema.pre(/^findOneAndUpdate/, async function () {
  //  'this' is the query object
  //  'this.model' is the model (Review)
  this.reviewDoc = await this.model.findOne(this.getFilter());
  // console.log("...🤬...this.r/doc:", this.reviewDoc);
});

reviewSchema.post(/^findOneAndUpdate/, async function () {
  // 2️⃣ Use the stored document
  if (this.reviewDoc) {
    await this.reviewDoc.constructor.calcAverageRatings(this.reviewDoc.tour);
  }
});

///..............DELETE middleware

// ✅ DELETE middleware
reviewSchema.pre(/^findOneAndDelete/, async function () {
  // This runs BEFORE a review is deleted
  this.r = await this.model.findOne(this.getFilter());
});

reviewSchema.post(/^findOneAndDelete/, async function () {
  // This runs AFTER a review is deleted
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
