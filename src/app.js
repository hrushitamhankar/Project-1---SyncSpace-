import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";

const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/rooms",
    roomRoutes
);

app.get(
    "/health",
    (req, res) => {
        res.status(200).json({
            status: "OK",
            environment:
                process.env.NODE_ENV,
            uptime:
                process.uptime(),
            timestamp:
                new Date().toISOString()
        });
    }
);

app.get(
    "/",
    (req, res) => {
        res.json({
            status:
                "Server Running"
        });
    }
);

export default app;