import {
    joinRoom,
    leaveRoom,
    getRoomMembers,
    removeSocketFromAllRooms
} from "./roomManager.js";

/**
 * Initialize all Socket.IO event handlers.
 *
 * @param {import("socket.io").Server} io
 */
export default function initializeSocket(io) {

    io.on("connection", (socket) => {

        console.log(`[CONNECT] ${socket.id}`);

        /**
         * Welcome event sent immediately after connection.
         */
        socket.emit("welcome", {
            message: "Connected to SyncSpace"
        });

        /**
         * Handle client joining a collaborative room.
         */
        socket.on("joinRoom", (roomId) => {

            // Validate room ID
            if (
                typeof roomId !== "string" ||
                roomId.trim().length === 0
            ) {

                socket.emit("room-error", {
                    message: "Invalid room ID"
                });

                return;
            }

            roomId = roomId.trim();

            // Prevent duplicate joins
            const members = getRoomMembers(roomId);

            if (members.includes(socket.id)) {

                socket.emit("room-error", {
                    message: "Already joined this room"
                });

                return;
            }

            socket.join(roomId);

            joinRoom(roomId, socket.id);

            console.log(`[JOIN] ${socket.id} -> ${roomId}`);
            console.log(
                `[ROOM] ${roomId}: ${getRoomMembers(roomId).length} member(s)`
            );

            // Notify other members
            socket.to(roomId).emit("user-joined", {
                socketId: socket.id
            });

            // Send updated member list
            socket.emit("room-members", {
                roomId,
                members: getRoomMembers(roomId)
            });

        });

        /**
         * Handle client leaving a collaborative room.
         */
        socket.on("leaveRoom", (roomId) => {

            if (
                typeof roomId !== "string" ||
                roomId.trim().length === 0
            ) {

                socket.emit("room-error", {
                    message: "Invalid room ID"
                });

                return;
            }

            roomId = roomId.trim();

            socket.leave(roomId);

            leaveRoom(roomId, socket.id);

            console.log(`[LEAVE] ${socket.id} -> ${roomId}`);

            socket.to(roomId).emit("user-left", {
                socketId: socket.id
            });

        });

        /**
         * Cleanup when client disconnects unexpectedly.
         */
        socket.on("disconnect", () => {

            console.log(`[DISCONNECT] ${socket.id}`);

            const leftRooms = removeSocketFromAllRooms(socket.id);

            leftRooms.forEach((roomId) => {

                socket.to(roomId).emit("user-left", {
                    socketId: socket.id
                });

                console.log(
                    `[CLEANUP] Removed ${socket.id} from ${roomId}`
                );

            });

        });

    });

}