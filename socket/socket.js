const jwt = require("jsonwebtoken");
const Room = require("../models/Room");
const Replay = require("../models/Replay");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // =========================================
        // GET JWT TOKEN
        // =========================================
        const token = socket.handshake.auth?.token;

        if (!token) {
            console.log("No JWT token provided");

            socket.emit("authError", {
                message: "Authentication token required"
            });

            socket.disconnect();
            return;
        }

        // =========================================
        // VERIFY JWT
        // =========================================
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = decoded;

            console.log("Authenticated user:", decoded);

            // =========================================
            // JOIN ROOM
            // =========================================
            socket.on("joinRoom", async (roomId) => {
                try {
                    if (!roomId) {
                        socket.emit("errorMessage", {
                            message: "Room ID is required"
                        });
                        return;
                    }

                    // Find room using roomId
                    const room = await Room.findOne({ roomId });

                    if (!room) {
                        socket.emit("errorMessage", {
                            message: "Room not found"
                        });
                        return;
                    }

                    // Get logged-in user ID
                    const userId =
                        socket.user.id || socket.user._id;

                    // =========================================
                    // CHECK OWNER
                    // =========================================
                    const isOwner =
                        room.ownerId.toString() ===
                        userId.toString();

                    // =========================================
                    // CHECK INVITED USER
                    // =========================================
                    const invitedMember =
                        room.invitedUsers.find(
                            (member) =>
                                member.user.toString() ===
                                userId.toString()
                        );

                    // =========================================
                    // CHECK ACCESS
                    // =========================================
                    if (!isOwner && !invitedMember) {
                        socket.emit("errorMessage", {
                            message:
                                "You are not invited to this room"
                        });
                        return;
                    }

                    // =========================================
                    // SET ROLE
                    // =========================================
                    let role;

                    if (isOwner) {
                        role = "owner";
                    } else {
                        role = invitedMember.role;
                    }

                    // Save room and role on socket
                    socket.roomId = roomId;
                    socket.role = role;

                    // Join Socket.IO room
                    socket.join(roomId);

                    console.log(
                        `User ${userId} joined ${roomId} as ${role}`
                    );

                    // =========================================
                    // JOIN SUCCESS
                    // =========================================
                    socket.emit("joinSuccess", {
                        message: "Joined Successfully",
                        roomId: roomId,
                        role: role
                    });

                    // Notify other users
                    socket.to(roomId).emit("user-joined", {
                        userId: userId,
                        role: role
                    });

                } catch (error) {
                    console.error(
                        "Join room error:",
                        error
                    );

                    socket.emit("errorMessage", {
                        message: "Failed to join room"
                    });
                }
            });

            // =========================================
            // EDIT / DRAWING EVENT
            // =========================================
            socket.on("editRoom", async (data) => {

                // User must first join a room
                if (!socket.roomId) {
                    socket.emit("permissionError", {
                        message:
                            "You must join a room first"
                    });
                    return;
                }

                // Viewer cannot edit
                if (
                    socket.role !== "owner" &&
                    socket.role !== "editor"
                ) {
                    socket.emit("permissionError", {
                        message:
                            "Viewers are not allowed to edit"
                    });

                    console.log(
                        `Viewer ${socket.user.id || socket.user._id} tried to edit`
                    );

                    return;
                }

                // Owner or Editor can edit
                console.log(
                    `User ${socket.user.id || socket.user._id} edited room ${socket.roomId}`
                );

                // Save edit event to MongoDB
                try {
                    await Replay.create({
                        roomId: socket.roomId,
                        userId: socket.user.id || socket.user._id,
                        role: socket.role,
                        eventType: "edit",
                        data: data
                    });

                    console.log("Edit event saved to replay history");

                } catch (error) {
                    console.error(
                        "Failed to save replay event:",
                        error.message
                    );
                }

                // Send edit to other users
                socket.to(socket.roomId).emit(
                    "roomEdited",
                    {
                        userId:
                            socket.user.id ||
                            socket.user._id,
                        role: socket.role,
                        data: data
                    }
                );
            });

            // =========================================
            // LEAVE ROOM
            // =========================================
            socket.on("leaveRoom", (roomId) => {
                if (!roomId) return;

                socket.leave(roomId);

                const userId =
                    socket.user.id || socket.user._id;

                console.log(
                    `User ${userId} left room ${roomId}`
                );

                socket.to(roomId).emit("user-left", {
                    userId: userId
                });

                socket.roomId = null;
                socket.role = null;
            });

            // =========================================
            // DISCONNECT
            // =========================================
            socket.on("disconnect", (reason) => {
                console.log(
                    `Socket disconnected: ${socket.id}`
                );

                console.log(
                    `Reason: ${reason}`
                );
            });

        } catch (error) {

            console.log(
                "JWT verification failed:",
                error.message
            );

            socket.emit("authError", {
                message: "Invalid or expired token"
            });

            socket.disconnect();
        }
    });
};