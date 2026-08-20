const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SyncSpace backend is running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SyncSpace API is healthy"
    });
});

app.use(errorHandler);

module.exports = app;