import {
    joinRoom,
    leaveRoom,
    getRoomMembers,
    removeSocketFromAllRooms
} from "./roomManager.js";

import {
    updateAwareness,
    removeSocketAwareness
} from "./awareness.js";

/**
 * Socket Events
 *
 * Client -> Server
 * --------------------------
 * joinRoom
 * leaveRoom
 * awareness-update
 *
 * Server -> Client
 * --------------------------
 * welcome
 * room-members
 * user-joined
 * user-left
 *
 * Week 2 (Upcoming)
 * --------------------------
 * cursor-update
 * user-updated
 * room-awareness
 */

/**
 * Initialize all Socket.IO event handlers.
 *
 * @param {import("socket.io").Server} io
 */
export default function initializeSocket(io) {

    io.on("connection", (socket) => {

        console.log(`[CONNECT] ${socket.id}`);

        /**
         * Welcome Event
         */
        socket.emit("welcome", {
            message: "Connected to SyncSpace"
        });

        /**
         * Join Room
         */
        socket.on("joinRoom", (roomId) => {

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

            socket.to(roomId).emit("user-joined", {
                socketId: socket.id
            });

            socket.emit("room-members", {
                roomId,
                members: getRoomMembers(roomId)
            });

        });

        /**
         * Leave Room
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
         * Awareness Update
         *
         * Day 1:
         * Store awareness only.
         * Broadcasting will be added on Day 2.
         */
        socket.on("awareness-update", (data) => {

            if (
                !data ||
                typeof data.roomId !== "string"
            ) {

                socket.emit("room-error", {
                    message: "Invalid awareness payload"
                });

                return;
            }

            updateAwareness(
                data.roomId,
                socket.id,
                {
                    socketId: socket.id,
                    ...data
                }
            );

            console.log(
                `[AWARENESS] Stored awareness for ${socket.id}`
            );

        });

        /**
         * Disconnect
         */
        socket.on("disconnect", () => {

            console.log(`[DISCONNECT] ${socket.id}`);

            const leftRooms = removeSocketFromAllRooms(socket.id);

            removeSocketAwareness(socket.id);

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