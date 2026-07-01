import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import userRoutes from "./routers/userRoutes.js";
import generateRoutes from "./routers/generateRoutes.js";
import subscriptionRoutes from "./routers/subscriptionRoutes.js";
import resetCreditsRoutes from "./routers/resetCreditsRoutes.js"


import { connectDB } from "./db/db.js";
connectDB();

const app = express();

// ✅ CORS must be first — before any routes
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://ai-thumbnail-generator-five.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true, // needed for Clerk auth cookies/headers
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/subscription", subscriptionRoutes);
<<<<<<< Updated upstream
app.use(express.json());
=======

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
>>>>>>> Stashed changes
app.use(helmet());
app.use(morgan("dev"));

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Server Is Running!");
});

app.use("/api/users", userRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/cron",resetCreditsRoutes)
// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
