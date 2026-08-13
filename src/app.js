import express from "express";
import cors from "cors";
import replayRouter from "./routes/replay.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/replay", replayRouter);

// Health Check
app.get("/", (req, res) => {
    res.json({
        status: "Server Running"
    });
});

export default app;