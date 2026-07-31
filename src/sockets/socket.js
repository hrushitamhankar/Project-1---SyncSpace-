import { createRequire } from "module";

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
    increment,
    decrement,
    getMetrics
} from "../utils/roomMetrics.js";

import {
    validateRoom
} from "../utils/socketValidator.js";

const require = createRequire(import.meta.url);

const {

    shouldThrottle,

    clearThrottle

} = require("../utils/throttle");

const {
    requestRoomSave
} = require("../utils/persistenceHooks");

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
 * awareness-updated
 */

/**
 * Initialize all Socket.IO event handlers.
 *
 * @param {import("socket.io").Server} io
 */
export default function initializeSocket(io) {

    io.on("connection", (socket) => {

        increment("activeUsers");

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

            if (!validateRoom(roomId, socket)) {
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
         * Called after a reconnect or browser refresh.
         */
        socket.on("rejoin-room", (roomId) => {

            if (!validateRoom(roomId, socket)) {
                return;
            }

            roomId = roomId.trim();

            // Prevent duplicate join
            if (getRoomMembers(roomId).includes(socket.id)) {

                socket.emit("room-error", {
                    message: "Already joined this room"
                });

                return;
            }

            socket.join(roomId);

            joinRoom(roomId, socket.id);

            increment("reconnects");

            console.log(`[REJOIN] ${socket.id} -> ${roomId}`);

            console.log(
                `[ROOM] ${roomId}: ${getRoomMembers(roomId).length} member(s)`
            );

            // Restore room state to reconnecting client
            socket.emit("room-restored", {
                roomId,
                members: getRoomMembers(roomId)
            });

            // Notify everyone else
            socket.to(roomId).emit("user-reconnected", {
                socketId: socket.id
            });

        });

        /**
         * Leave Room
         */
        socket.on("leaveRoom", (roomId) => {

            if (!validateRoom(roomId, socket)) {
                return;
            }

            roomId = roomId.trim();

            socket.leave(roomId);

            leaveRoom(roomId, socket.id);

            requestRoomSave(
                roomId,
                "leave-room"
            );

            console.log(`[LEAVE] ${socket.id} -> ${roomId}`);

            socket.to(roomId).emit("user-left", {
                socketId: socket.id
            });

        });

        /**
         * Awareness Update
         *
         * Stores awareness state and relays it
         * to all other users in the room.
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

            // Validate room ID
            if (!roomId) {

                socket.emit("room-error", {
                    message: "Room ID cannot be empty."
                });

                console.warn(
                    `[WARNING] ${socket.id} sent an empty room ID for awareness update`
                );

                return;
            }

            // Ensure socket belongs to the room
            if (!socket.rooms.has(roomId)) {

                socket.emit("room-error", {
                    message: "Join the room before sending awareness updates."
                });

                console.warn(
                    `[WARNING] ${socket.id} attempted awareness update without joining room ${roomId}`
                );

                return;
            }

            if (
                shouldThrottle(
                    `awareness-${socket.id}`,
                    50
                )
            ) {
                return;
            }

            const awareness = {

                socketId: socket.id,

                cursor: data.cursor || null,

                user: data.user || null,

                timestamp: Date.now()

            };

            // Store awareness state
            updateAwareness(
                roomId,
                socket.id,
                awareness
            );

            increment("awarenessUpdates");

            console.log(
                `[AWARENESS] ${socket.id} updated awareness in room ${roomId}`
            );

            // Relay awareness to everyone except sender
            socket.to(roomId).emit(
                "awareness-updated",
                awareness
            );

        });

        /**
         * Server Metrics (debug)
         */
        socket.on("server-metrics", () => {

            socket.emit(
                "server-metrics",
                getMetrics()
            );

        });

        /**
         * Disconnect
         */
        socket.on("disconnect", () => {

            decrement("activeUsers");

            const leftRooms = removeSocketFromAllRooms(socket.id);

            removeSocketAwareness(socket.id);

            clearThrottle(
                `awareness-${socket.id}`
            );

            // Request persistence for every room
            leftRooms.forEach((roomId) => {

                requestRoomSave(
                    roomId,
                    "disconnect"
                );

            });

            console.log(
                `[DISCONNECT] ${socket.id} disconnected`
            );

        });

    });

}