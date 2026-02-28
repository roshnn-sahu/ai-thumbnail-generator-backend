import "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import userRoutes from "./routers/userRoutes.js";
import generateRoutes from "./routers/generateRoutes.js";
import subscriptionRoutes from "./routers/subscriptionRoutes.js"


import "./jobs/resetDailyUsage.js";


import { connectDB } from "./db/db.js";
connectDB();

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

const PORT = process.env.PORT || 5000;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

app.get("/", (req, res) => {
    res.send("Server Is Running!");
});

app.use("/api/subscription", subscriptionRoutes);

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/generate", generateRoutes);


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
