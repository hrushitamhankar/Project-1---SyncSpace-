import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import initializeSocket from "./sockets/socket.js";
import { connectMongo } from "./db/mongo.js"; // B2: MongoDB connection

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

initializeSocket(io);

const PORT = process.env.PORT || 5000;

// B2: Connect MongoDB before starting the server
connectMongo()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("[MONGO] Connection failed:", error);
        process.exit(1);
    });