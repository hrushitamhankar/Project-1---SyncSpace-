import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import initializeSocket from "./sockets/socket.js";
import { config } from "./config/config.js";

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: config.CLIENT_URL,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

initializeSocket(io);

server.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});