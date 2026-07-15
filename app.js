const express = require("express");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// Middleware
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
    res.send("Backend is running...");
});

// Error Handling Middleware (must be last)
app.use(errorHandler);

module.exports = app;