const express = require("express");
const app = express();
const cors = require("cors");
const dbConfig = require("./config/dbConfig");
const dotenv = require("dotenv");
const isValidUser = require("./middleware/isValidUser");
const authRoutes = require("./routes/auth/auth");
const todoRoutes = require("./routes/todo/todoRoutes");
// configuration files.
dotenv.config();
dbConfig(process.env.DATABASE_URL);

// app level middlewares

// 1. to accept json data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. cors
app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:3000'],
    allowedHeaders: [
      "Content-Type",
      "authorization",
      "Access-Control-Allow-Methods",
      "Access-Control-Request-Headers",
      "Access-Control-Allow-Origin",
    ],
    enablePreflight: true
  })
);

// // 3. auth middleware
// app.use(isValidUser)

// Routes
// 1. Public routes
app.use("/auth", authRoutes);

// 2. protected routes.
app.use("/task", isValidUser, todoRoutes);

// server setup.
app.listen(process.env.PORT, (err) => {
  if (err) {
    console.log("error while starting the server.");
    console.log(err);
  } else {
    console.log(`Server started at http://localhost:${process.env.PORT}`);
  }
});
