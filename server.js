const mongoose = require("mongoose");
const dotenv = require("dotenv");

//1️⃣ FIRST: Uncaught Exception Handler
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

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

// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'A tour must have a name'],
//     unique: true,
//   },
//   price: {
//     type: Number,
//     required: [true, 'A tour must have a price'],
//   },
//   rating: {
//     type: Number,
//     default: 4.5,
//   },
// });

// const Tour = mongoose.model('Tour', tourSchema);

// console.log('express env:', app.get('env'));
// console.log('nodejs env:', process.env);

// ✅ ONLY log the variables you care about:
console.log("🟢 Node.js env:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   DATABASE: ${process.env.DATABASE}`);

// ✅ Check if variables are loaded
console.log("📊 Environment loaded:");
console.log(`   .env file loaded: ${process.env.NODE_ENV ? "✅" : "❌"}`);

const port = process.env.PORT || 3000;
// const port = 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// 1️⃣ Unhandled Rejection Handler (BEFORE server starts)
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
