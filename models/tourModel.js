const mongoose = require("mongoose");
const slugify = require("slugify").default || require("slugify");
const User = require("./usersModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxLength: [40, "A TOUR MUST HAVE LESS OR EQUAL THAN 40 CHARACTERS "],
      minLength: [10, "A TOUR MUST HAVE MORE OR EQUAL THAN 10 CHARACTERS "],
      // validate: [validator.isAlpha, "TOUR NAME MUST ONLY CONTAIN CHARACTORS"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty is either: easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    // priceDiscount: Number,
    priceDiscount: {
      type: Number,
      // validate: function (val) {
      //   return val < this.price;
      // },
      validate: {
        message: "discount price ({VALUE}) should be below the regular price",
        validator: function (val) {
          return val < this.price;
        },
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "A tour must have a description"],
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false, //usually tours are not secret
    },
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // In tourModel.js
    guides: [
      {
        type: mongoose.Schema.ObjectId, // I expect the type of the each elements in the guides array to be the mongodb id
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, // ✅ Also good to include
  },
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });

//................DOCUMENT MIDDLEWARE
tourSchema.pre("save", async function () {
  this.slug = slugify(this.name, { lower: true });
  console.log("🎃SLUG:", this.slug);
  // next();?
});
// tourSchema.pre("save", async function () {
//   console.log("WE WILL SEE DOCUMENTS");
// });

// tourSchema.post("save", function (doc, next) {
//   console.log(`✅ Tour "${doc.name}" was saved!`);
//   next();
// });

//...............QUERY MIDDLEWARE
// tourSchema.pre("find", function () {
tourSchema.pre(/^find/, function (next) {
  //all the commands that start with find
  this.find({ secretTour: { $ne: true } });
  // next();
});

//...............QUERY MIDDLEWAREs
tourSchema.pre(/^find/, function (docs, next) {
  this.populate({
    path: "guides",
    select: "-password -__v", // ← Exclude password and __v
  });
  // next();
});

tourSchema.post(/^find/, function (docs, next) {
  // console.log(docs);
  next();
});

//...............AGGREGATION MIDDLEWARE
// tourSchema.pre("aggregate", function (next) {
//   // console.log("....🎉....aggregate:", this); //Gets the current aggregation pipeline array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
// });

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//.............VIRTUAL POPULATE
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
