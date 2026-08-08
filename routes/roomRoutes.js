const express = require("express");
const router = express.Router();

const {
    createRoom,
    inviteUser,
    getMyRooms
} = require("../controllers/roomController");

const authMiddleware = require("../middleware/authMiddleware");

// =========================================
// CREATE ROOM
// =========================================
router.post("/create", authMiddleware, createRoom);

// =========================================
// INVITE USER
// =========================================
router.post("/invite", authMiddleware, inviteUser);

// =========================================
// GET MY ROOMS
// =========================================
router.get("/myrooms", authMiddleware, getMyRooms);

module.exports = router;