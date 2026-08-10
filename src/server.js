import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import initializeSocket from "./sockets/socket.js";
import { config } from "./config/config.js";
import { connectDB, disconnectDB } from "./config/db.js";

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

initializeSocket(io);

// =========================================
// START SERVER
// =========================================

async function startServer() {
    try {
        // Connect MongoDB before accepting requests
        await connectDB();

        const serverInstance = server.listen(config.PORT, () => {
            console.log(`Server running on port ${config.PORT}`);
        });

        // =========================================
        // GRACEFUL SHUTDOWN
        // =========================================

        function gracefulShutdown(signal) {
            console.log(
                `\n${signal} received. Shutting down server...`
            );

            serverInstance.close(async () => {
                console.log("HTTP server closed.");

                await disconnectDB();

                process.exit(0);
            });
        }

        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();