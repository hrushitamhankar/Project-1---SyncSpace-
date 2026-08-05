import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import initializeSocket from "./sockets/socket.js";
import { config } from "./config/config.js";

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

initializeSocket(io);

const serverInstance = server.listen(config.PORT, () => {

    console.log(`
======================================
 SyncSpace Backend Started
 Environment : ${config.NODE_ENV}
 Port        : ${config.PORT}
======================================
`);

});

function gracefulShutdown(signal) {

    console.log(
        `\n${signal} received. Shutting down server...`
    );

    serverInstance.close(() => {

        console.log("HTTP server closed.");

        process.exit(0);

    });

}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));