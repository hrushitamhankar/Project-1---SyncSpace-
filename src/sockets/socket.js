import {
    joinRoom,
    leaveRoom,
    getRoomMembers,
    removeSocketFromAllRooms
} from "./roomManager.js";

export default function initializeSocket(io) {

    io.on("connection", (socket) => {

        console.log(`Connected: ${socket.id}`);

        // Welcome event
        socket.emit("welcome", {
            message: "Connected to SyncSpace"
        });

        // Join Room
        socket.on("joinRoom", (roomId) => {

            socket.join(roomId);

            joinRoom(roomId, socket.id);

            console.log(`${socket.id} joined room ${roomId}`);
            console.log(`Room ${roomId}: ${getRoomMembers(roomId).length} member(s)`);

            // Notify everyone except the new user
            socket.to(roomId).emit("user-joined", {
                socketId: socket.id
            });

            // Send current room members to the joining user
            socket.emit("room-members", {
                roomId,
                members: getRoomMembers(roomId)
            });

        });

        // Leave Room
        socket.on("leaveRoom", (roomId) => {

            socket.leave(roomId);

            leaveRoom(roomId, socket.id);

            console.log(`${socket.id} left room ${roomId}`);

            socket.to(roomId).emit("user-left", {
                socketId: socket.id
            });

        });

        // Disconnect
        socket.on("disconnect", () => {

            console.log(`Disconnected: ${socket.id}`);

            const leftRooms = removeSocketFromAllRooms(socket.id);

            leftRooms.forEach((roomId) => {

                socket.to(roomId).emit("user-left", {
                    socketId: socket.id
                });

                console.log(`Removed ${socket.id} from ${roomId}`);

            });

        });

    });

}