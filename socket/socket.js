const jwt = require("jsonwebtoken");
const Room = require("../models/Room");

const socketHandler = (io) => {

    // JWT Authentication Middleware
    io.use((socket, next) => {

        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error("Authentication Error"));
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = decoded;

            next();

        } catch (err) {
            return next(new Error("Invalid Token"));
        }

    });

    // Socket Connection
    io.on("connection", (socket) => {

        console.log("==================================");
        console.log("Socket connected:", socket.id);
        console.log("User:", socket.user);
        console.log("==================================");

        // Join Room
        socket.on("joinRoom", async (roomId) => {

            console.log("joinRoom event received");
            console.log("Room ID:", roomId);

            try {

                const room = await Room.findById(roomId);

                console.log("Room:", room);

                if (!room) {
                    console.log("Room not found");
                    return socket.emit("error", "Room not found");
                }

                const userId = socket.user.id;

                console.log("User ID:", userId);

                const isOwner =
                    room.ownerId.toString() === userId;

                const isInvited =
                    room.invitedUsers.some(
                        (user) => user.toString() === userId
                    );

                console.log("Is Owner:", isOwner);
                console.log("Is Invited:", isInvited);

                if (!isOwner && !isInvited) {
                    console.log("Access Denied");
                    return socket.emit("error", "Access Denied");
                }

                socket.join(roomId);

                socket.emit(
                    "joined",
                    "Joined Successfully"
                );

                socket.to(roomId).emit(
                    "user-joined",
                    userId
                );

                console.log("User joined room successfully");

            } catch (err) {

                console.log("Join Room Error:", err);

                socket.emit(
                    "error",
                    err.message
                );

            }

        });

        socket.on("disconnect", () => {

            console.log("Socket disconnected:", socket.id);

        });

    });

};

module.exports = socketHandler;