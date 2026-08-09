const express = require("express");
const router = express.Router();

const {
    createRoom,
    inviteUser,
    getMyRooms,
    changeUserRole,
    getRoomReplay
} = require("../controllers/roomController");

const authMiddleware = require("../middleware/authMiddleware");

// Create room
router.post("/create", authMiddleware, createRoom);

// Invite user
router.post("/invite", authMiddleware, inviteUser);

// Change user role
router.put("/role", authMiddleware, changeUserRole);

// Get my rooms
router.get("/myrooms", authMiddleware, getMyRooms);

router.get(
    "/:roomId/replay",
    authMiddleware,
    getRoomReplay
);

module.exports = router;