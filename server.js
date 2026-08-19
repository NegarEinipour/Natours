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

//.........ATLAS DATABASE CONNECTION
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => {
    console.log("ATLAS DATABASE CONNECETED ✨✨");
  })
  .catch((err) => {
    console.error(" Database connection error: ❌", err);
  });

//.......LOCAL DATA BASE CONNECTION
// mongoose
//   .connect(process.env.DATABASE_LOCAL)
//   // .then((con) => {
//   .then(() => {
//     // console.log('con.connections', con.connections);
//     console.log("Local Database connected successfully! 🎉");
//   })
//   .catch((err) => {
//     console.error(" Database connection error: ❌", err);
//   });

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
