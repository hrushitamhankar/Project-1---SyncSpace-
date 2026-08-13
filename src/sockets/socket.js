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
    destroyRoom,
    restoreRoom,
    persistRoom,
    finalizeReplaySnapshot
} from "../yjs/manager.js";

import {
    updateLocalAwareness
} from "../yjs/awareness.js";

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
        socket.on("joinRoom", async (roomId) => {

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

            // B2: Restore persisted Yjs document if available
            const doc = await restoreRoom(roomId);

            // Initialize Yjs awareness
            const { awareness } = initializeRoom(roomId);

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
         * Called after a reconnect or browser refresh.
         */
        socket.on("rejoin-room", async (roomId) => {

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

            // Prevent duplicate join
            if (getRoomMembers(roomId).includes(socket.id)) {

                socket.emit("room-error", {
                    message: "Already joined this room"
                });

                return;
            }

            socket.join(roomId);

            joinRoom(roomId, socket.id);

            // B2: Restore persisted Yjs document after reconnect
            const doc = await restoreRoom(roomId);

            // Initialize Yjs awareness
            const { awareness } = initializeRoom(roomId);

            console.log(`[YJS] Room restored: ${roomId}`, {
                hasDocument: !!doc,
                hasAwareness: !!awareness
            });

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
        socket.on("leaveRoom", async (roomId) => {

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

            const members = getRoomMembers(roomId);

            /**
             * B2:
             * Persist the current document and final replay
             * snapshot before destroying an empty room.
             */
            if (members.length === 0) {

                await persistRoom(roomId);

                await finalizeReplaySnapshot(roomId);

                destroyRoom(roomId);
            }

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

            // B2: Ensure Yjs room exists before processing awareness
            const { awareness: yjsAwareness } = initializeRoom(roomId);

            console.log(`[YJS] Awareness ready for room: ${roomId}`, {
                initialized: !!yjsAwareness
            });

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

            // B2: Update Yjs Awareness
            updateLocalAwareness(
                roomId,
                socket.id,
                {
                    cursor: data.cursor || null,
                    user: data.user || null
                }
            );

            console.log(
                `[AWARENESS] ${socket.id} -> ${roomId}`,
                awareness
            );

            // Relay awareness to everyone except sender
            socket.to(roomId).emit(
                "awareness-updated",
                awareness
            );

        });

        /**
         * Disconnect
         */
        socket.on("disconnect", async () => {

            console.log(`[DISCONNECT] ${socket.id}`);

            const leftRooms = removeSocketFromAllRooms(socket.id);

            removeSocketAwareness(socket.id);

            for (const roomId of leftRooms) {

                socket.to(roomId).emit("user-left", {
                    socketId: socket.id
                });

                console.log(
                    `[CLEANUP] Removed ${socket.id} from ${roomId}`
                );

                /**
                 * B2:
                 * Persist the current document and final replay
                 * snapshot before destroying an empty room.
                 */
                if (getRoomMembers(roomId).length === 0) {

                    await persistRoom(roomId);

                    await finalizeReplaySnapshot(roomId);

                    destroyRoom(roomId);
                }

            }

        });

    });

}