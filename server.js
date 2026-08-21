const mongoose = require("mongoose");
const dotenv = require("dotenv");

// UNCAUGHT EXCEPTION HANDLER
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// ENVIRONMENT VARIABLES
dotenv.config({ path: "./config.env" });
const app = require("./app");

// DATABASE CONNECTION
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => {
    console.log("✅ Atlas database connected successfully!");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
  });

// START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 App running on port ${port}`);
});

// UNHANDLED REJECTION HANDLER
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
