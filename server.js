require("dotenv").config();

const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const app = require("./app");
const initializeSocket = require("./src/sockets/socket");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error(
                "MONGO_URI is missing from .env"
            );
        }

        // MongoDB
        await mongoose.connect(
            process.env.MONGO_URI,
            {
                serverSelectionTimeoutMS: 10000,
            }
        );

        console.log("MongoDB connected");

        // HTTP server
        const httpServer =
            http.createServer(app);

        // Socket.IO
        const io = new Server(
            httpServer,
            {
                cors: {
                    origin: "http://localhost:5173",
                    methods: [
                        "GET",
                        "POST",
                    ],
                    credentials: true,
                },

                transports: [
                    "websocket",
                    "polling",
                ],
            }
        );

        // Initialize collaboration
        initializeSocket(io);

        httpServer.listen(
            PORT,
            () => {
                console.log(
                    `SyncSpace backend running on port ${PORT}`
                );

                console.log(
                    `Socket.IO running on port ${PORT}`
                );
            }
        );

    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
}

startServer();