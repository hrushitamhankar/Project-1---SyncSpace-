const jwt = require("jsonwebtoken");
const Room = require("../models/Room");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // =========================
    // GET JWT TOKEN
    // =========================
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log("No JWT token provided");

      socket.emit("authError", {
        message: "Authentication token required"
      });

      socket.disconnect();
      return;
    }

    // =========================
    // VERIFY JWT
    // =========================
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Store logged-in user
      socket.user = decoded;

      console.log("Authenticated user:", decoded);

      // =========================
      // JOIN ROOM
      // =========================
      socket.on("joinRoom", async (roomId) => {
        try {
          if (!roomId) {
            socket.emit("errorMessage", {
              message: "Room ID is required"
            });
            return;
          }

          // Find room
          const room = await Room.findOne({ roomId: roomId });

          if (!room) {
            socket.emit("errorMessage", {
              message: "Room not found"
            });
            return;
          }

          // Get logged-in user's ID
          const userId = socket.user.id || socket.user._id;

          // =========================
          // CHECK OWNER
          // =========================
          const isOwner =
            room.ownerId.toString() === userId.toString();

          // =========================
          // CHECK INVITED USER
          // =========================
          const invitedUser = room.invitedUsers.find(
            (invited) =>
              invited.user.toString() === userId.toString()
          );

          // =========================
          // CHECK PERMISSION
          // =========================
          if (!isOwner && !invitedUser) {
            socket.emit("errorMessage", {
              message: "You are not invited to this room"
            });

            console.log(
              `Unauthorized user ${userId} tried to join room ${roomId}`
            );

            return;
          }

          // =========================
          // GET ROLE
          // =========================
          let role = "owner";

          if (invitedUser) {
            role = invitedUser.role;
          }

          // Save room information on socket
          socket.roomId = roomId;
          socket.role = role;

          // Join Socket.IO room
          socket.join(roomId);

          console.log(
            `User ${userId} joined room ${roomId} as ${role}`
          );

          // Send success response
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
          console.error("Join room error:", error);

          socket.emit("errorMessage", {
            message: "Failed to join room"
          });
        }
      });

      // =========================
      // LEAVE ROOM
      // =========================
      socket.on("leaveRoom", (roomId) => {
        if (!roomId) {
          return;
        }

        socket.leave(roomId);

        const userId = socket.user.id || socket.user._id;

        console.log(
          `User ${userId} left room ${roomId}`
        );

        socket.to(roomId).emit("user-left", {
          userId: userId
        });

        socket.roomId = null;
        socket.role = null;
      });

      // =========================
      // DISCONNECT
      // =========================
      socket.on("disconnect", (reason) => {
        console.log(
          `Socket disconnected: ${socket.id}`
        );

        console.log(`Reason: ${reason}`);
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