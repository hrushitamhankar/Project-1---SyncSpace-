import socketAuth from "../middleware/socketAuth.js";

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

import {
    initializeRoom,
    destroyRoom
} from "../yjs/manager.js";

/**
 * Socket Events
 *
 * Client -> Server
 * --------------------------
 * joinRoom
 * leaveRoom
 * rejoin-room
 * awareness-update
 *
 * Server -> Client
 * --------------------------
 * welcome
 * room-members
 * user-joined
 * user-left
 * awareness-updated
 * room-restored
 * user-reconnected
 * room-error
 */

/**
 * Initialize all Socket.IO event handlers.
 *
 * Authentication is applied BEFORE
 * the existing B1/B2 socket handlers.
 *
 * @param {import("socket.io").Server} io
 */
export default function initializeSocket(io) {

    // =========================================
    // B3 SOCKET JWT AUTHENTICATION
    // =========================================
    //
    // This runs before "connection".
    // Unauthenticated sockets are rejected.
    //
    io.use(socketAuth);

    // =========================================
    // EXISTING B1/B2 SOCKET LOGIC
    // =========================================

    io.on("connection", (socket) => {

        console.log(`[CONNECT] ${socket.id}`);

        console.log(
            `[AUTH] Authenticated user:`,
            socket.user?.id || socket.user?._id
        );

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

            // B2: Initialize Yjs document and awareness
            const { doc, awareness } = initializeRoom(roomId);

            console.log(`[YJS] Room initialized: ${roomId}`, {
                hasDocument: !!doc,
                hasAwareness: !!awareness
            });

            console.log(`[JOIN] ${socket.id} -> ${roomId}`);

            console.log(
                `[ROOM] ${roomId}: ${getRoomMembers(roomId).length} member(s)`
            );

            // Notify other users
            socket.to(roomId).emit("user-joined", {
                socketId: socket.id
            });

            // Send current room members
            socket.emit("room-members", {
                roomId,
                members: getRoomMembers(roomId)
            });
        });

        /**
         * Rejoin Room
         *
         * Called after reconnect/browser refresh.
         */
        socket.on("rejoin-room", (roomId) => {

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

            if (getRoomMembers(roomId).includes(socket.id)) {
                socket.emit("room-error", {
                    message: "Already joined this room"
                });

                return;
            }

            socket.join(roomId);

            joinRoom(roomId, socket.id);

            console.log(`[REJOIN] ${socket.id} -> ${roomId}`);

            console.log(
                `[ROOM] ${roomId}: ${getRoomMembers(roomId).length} member(s)`
            );

            socket.emit("room-restored", {
                roomId,
                members: getRoomMembers(roomId)
            });

            socket.to(roomId).emit("user-reconnected", {
                socketId: socket.id
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

            if (getRoomMembers(roomId).length === 0) {
                destroyRoom(roomId);
            }
        });

        /**
         * Awareness Update
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

            const roomId = data.roomId.trim();

            if (!roomId) {
                socket.emit("room-error", {
                    message: "Room ID cannot be empty"
                });

                return;
            }

            if (!socket.rooms.has(roomId)) {
                socket.emit("room-error", {
                    message: "You are not a member of this room"
                });

                return;
            }

            // B2: Ensure Yjs room exists
            const { awareness: yjsAwareness } =
                initializeRoom(roomId);

            console.log(
                `[YJS] Awareness ready for room: ${roomId}`,
                {
                    initialized: !!yjsAwareness
                }
            );

            const awareness = {
                socketId: socket.id,
                cursor: data.cursor || null,
                user: data.user || null,
                timestamp: Date.now()
            };

            updateAwareness(
                roomId,
                socket.id,
                awareness
            );

            console.log(
                `[AWARENESS] ${socket.id} -> ${roomId}`,
                awareness
            );

            socket.to(roomId).emit(
                "awareness-updated",
                awareness
            );
        });

        /**
         * Disconnect
         */
        socket.on("disconnect", () => {

            console.log(
                `[DISCONNECT] ${socket.id} disconnected`
            );

            const leftRooms =
                removeSocketFromAllRooms(socket.id);

            removeSocketAwareness(socket.id);

            leftRooms.forEach((roomId) => {

                socket.to(roomId).emit("user-left", {
                    socketId: socket.id
                });

                console.log(
                    `[CLEANUP] Removed ${socket.id} from room ${roomId}`
                );

                if (
                    getRoomMembers(roomId).length === 0
                ) {
                    destroyRoom(roomId);
                }
            });
        });
    });
}