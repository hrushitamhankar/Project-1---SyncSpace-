import express from "express";
import cors from "cors";

import { config } from "./config/config.js";

const app = express();

// Middleware
app.use(
    cors({
        origin: config.CLIENT_URL,
        credentials: true
    })
);
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
    res.json({
        status: "Server Running"
    });
});

export default app;