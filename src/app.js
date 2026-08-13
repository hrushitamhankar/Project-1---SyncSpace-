import express from "express";
import cors from "cors";

import { config } from "./config/config.js";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import replayRouter from "./routes/replay.js";

const app = express();

// =========================================
// B1/B2 EXISTING MIDDLEWARE
// =========================================

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());

app.use("/api/replay", replayRouter);
// =========================================
// HEALTH CHECK - KEEP EXISTING
// =========================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// =========================================
// ROOT
// =========================================

app.get("/", (req, res) => {
    res.json({
        status: "Server Running"
    });
});

// =========================================
// AUTH ROUTES - B3
// =========================================

app.use("/api/auth", authRoutes);

// =========================================
// ROOM ROUTES - B3
// =========================================

app.use("/api/rooms", roomRoutes);

export default app;