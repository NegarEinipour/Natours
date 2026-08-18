const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./../../models/tourModel");
const Review = require("./../../models/reviewModel");
const User = require("./../../models/usersModel");

dotenv.config({ path: "./config.env" });

//.........DATABASE CONNECTION
// ✅ Pass the connection string from your .env file
mongoose
  .connect(process.env.DATABASE_LOCAL)
  // .then((con) => {
  .then(() => {
    // console.log('con.connections', con.connections);
    console.log("✅ Database connected successfully!");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });

//.............READ THE JSON FILE
const tours = JSON.parse(
  // fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8"),
  fs.readFileSync(`${__dirname}/tours.json`, "utf-8"),
);
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8"),
);

//.............IMPORT DATA INTO THE DATABASE
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("🎉 DATA SUCCESSFULLY LOADED!");
    process.exit();
  } catch (err) {
    console.log("err:", err);
  }
};

//.............DELETE ALL THE DATA FROM THE COLLECTION

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("🎉 DATA SUCCESSFULLY DELETED!");
    process.exit();
  } catch (err) {
    console.log("err:", err);
  }
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
// console.log(process.argv);
