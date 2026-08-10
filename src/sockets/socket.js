import socketAuth from "../middleware/socketAuth.js";

import {
    joinRoom,
    leaveRoom,
    removeSocketFromAllRooms
} from "./roomManager.js";

let ioInstance = null;

// =========================================
// INITIALIZE SOCKET.IO
// =========================================

export default function initializeSocket(io) {

    ioInstance = io;

    // =========================================
    // B3 JWT AUTHENTICATION
    // =========================================

    io.use(socketAuth);

    // =========================================
    // SOCKET CONNECTION
    // =========================================

    io.on("connection", (socket) => {

        console.log(
            "Socket connected:",
            socket.id
        );

        console.log(
            "Authenticated user:",
            socket.user?.id ||
            socket.user?._id
        );

        // =========================================
        // JOIN ROOM
        // =========================================

        socket.on("joinRoom", (roomId) => {

            if (!roomId) {
                socket.emit("errorMessage", {
                    message: "Room ID is required"
                });

                return;
            }

            joinRoom(
                roomId,
                socket.id
            );

            socket.join(roomId);

            console.log(
                `Socket ${socket.id} joined room ${roomId}`
            );

            socket.emit("joinSuccess", {
                message: "Joined Successfully",
                roomId
            });

            socket.to(roomId).emit(
                "user-joined",
                {
                    socketId: socket.id,
                    userId:
                        socket.user?.id ||
                        socket.user?._id
                }
            );
        });

        // =========================================
        // LEAVE ROOM
        // =========================================

        socket.on("leaveRoom", (roomId) => {

            if (!roomId) {
                return;
            }

            leaveRoom(
                roomId,
                socket.id
            );

            socket.leave(roomId);

            console.log(
                `Socket ${socket.id} left room ${roomId}`
            );

            socket.to(roomId).emit(
                "user-left",
                {
                    socketId: socket.id,
                    userId:
                        socket.user?.id ||
                        socket.user?._id
                }
            );
        });

        // =========================================
        // DISCONNECT
        // =========================================

        socket.on("disconnect", (reason) => {

            const leftRooms =
                removeSocketFromAllRooms(
                    socket.id
                );

            console.log(
                "Socket disconnected:",
                socket.id
            );

            console.log(
                "Reason:",
                reason
            );

            console.log(
                "Removed from rooms:",
                leftRooms
            );
        });
    });
}

// =========================================
// GET SOCKET.IO INSTANCE
// =========================================

export function getIO() {
    return ioInstance;
}