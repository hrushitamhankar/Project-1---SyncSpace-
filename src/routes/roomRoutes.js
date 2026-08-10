import express from "express";

import {
    createRoom,
    inviteUser,
    getMyRooms,
    changeUserRole,
    getRoomReplay
} from "../controllers/roomController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// =========================================
// CREATE ROOM
// =========================================

router.post(
    "/create",
    authMiddleware,
    createRoom
);

// =========================================
// INVITE USER
// =========================================

router.post(
    "/invite",
    authMiddleware,
    inviteUser
);

// =========================================
// CHANGE USER ROLE
// =========================================

router.put(
    "/role",
    authMiddleware,
    changeUserRole
);

// =========================================
// GET MY ROOMS
// =========================================

router.get(
    "/myrooms",
    authMiddleware,
    getMyRooms
);

// =========================================
// GET ROOM REPLAY
// =========================================

router.get(
    "/:roomId/replay",
    authMiddleware,
    getRoomReplay
);

export default router;