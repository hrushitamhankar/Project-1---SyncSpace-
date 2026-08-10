import Room from "../models/Room.js";
import User from "../models/User.js";
import Replay from "../models/Replay.js";

// =========================================
// CREATE ROOM
// =========================================

export async function createRoom(req, res) {
    try {
        const { roomId } = req.body;

        const ownerId =
            req.user.id || req.user._id;

        if (!roomId) {
            return res.status(400).json({
                message: "Room ID is required"
            });
        }

        const existingRoom =
            await Room.findOne({ roomId });

        if (existingRoom) {
            return res.status(400).json({
                message: "Room ID already exists"
            });
        }

        const room = await Room.create({
            roomId,
            ownerId,
            invitedUsers: []
        });

        res.status(201).json({
            message: "Room Created Successfully",
            room
        });

    } catch (error) {
        console.error(
            "Create room error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
}

// =========================================
// INVITE USER
// =========================================

export async function inviteUser(req, res) {
    try {
        const {
            roomId,
            email,
            role
        } = req.body;

        if (!roomId || !email) {
            return res.status(400).json({
                message:
                    "Room ID and email are required"
            });
        }

        const room =
            await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const loggedInUserId =
            req.user.id || req.user._id;

        // Only owner can invite
        if (
            room.ownerId.toString() !==
            loggedInUserId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the room owner can invite users"
            });
        }

        const user =
            await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const validRoles = [
            "viewer",
            "editor"
        ];

        if (
            role &&
            !validRoles.includes(role)
        ) {
            return res.status(400).json({
                message:
                    "Invalid role. Use viewer or editor."
            });
        }

        const alreadyInvited =
            room.invitedUsers.some(
                (member) =>
                    member.user.toString() ===
                    user._id.toString()
            );

        if (alreadyInvited) {
            return res.status(400).json({
                message:
                    "User is already invited"
            });
        }

        // Owner is already a member
        if (
            room.ownerId.toString() ===
            user._id.toString()
        ) {
            return res.status(400).json({
                message:
                    "Room owner is already a member"
            });
        }

        room.invitedUsers.push({
            user: user._id,
            role: role || "viewer"
        });

        await room.save();

        res.status(200).json({
            message:
                "User invited successfully",
            room
        });

    } catch (error) {
        console.error(
            "Invite user error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
}

// =========================================
// CHANGE USER ROLE
// =========================================

export async function changeUserRole(
    req,
    res
) {
    try {
        const {
            roomId,
            email,
            role
        } = req.body;

        if (
            !roomId ||
            !email ||
            !role
        ) {
            return res.status(400).json({
                message:
                    "Room ID, email and role are required"
            });
        }

        if (
            !["editor", "viewer"].includes(
                role
            )
        ) {
            return res.status(400).json({
                message:
                    "Role must be editor or viewer"
            });
        }

        const room =
            await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const loggedInUserId =
            req.user.id || req.user._id;

        // Only owner can change roles
        if (
            room.ownerId.toString() !==
            loggedInUserId.toString()
        ) {
            return res.status(403).json({
                message:
                    "Only the room owner can change user roles"
            });
        }

        const user =
            await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const member =
            room.invitedUsers.find(
                (item) =>
                    item.user.toString() ===
                    user._id.toString()
            );

        if (!member) {
            return res.status(404).json({
                message:
                    "User is not invited to this room"
            });
        }

        member.role = role;

        await room.save();

        res.status(200).json({
            message:
                "User role updated successfully",
            room
        });

    } catch (error) {
        console.error(
            "Change role error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
}

// =========================================
// GET MY ROOMS
// =========================================

export async function getMyRooms(
    req,
    res
) {
    try {
        const userId =
            req.user.id || req.user._id;

        const rooms =
            await Room.find({
                ownerId: userId
            }).populate(
                "invitedUsers.user",
                "name email"
            );

        res.status(200).json({
            message:
                "Rooms fetched successfully",
            rooms
        });

    } catch (error) {
        console.error(
            "Get rooms error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
}

// =========================================
// GET ROOM REPLAY
// =========================================

export async function getRoomReplay(
    req,
    res
) {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                message:
                    "Room ID is required"
            });
        }

        const room =
            await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        const userId =
            req.user.id || req.user._id;

        const isOwner =
            room.ownerId.toString() ===
            userId.toString();

        const isInvited =
            room.invitedUsers.some(
                (member) =>
                    member.user.toString() ===
                    userId.toString()
            );

        if (!isOwner && !isInvited) {
            return res.status(403).json({
                message:
                    "You are not allowed to view this replay"
            });
        }

        const replay =
            await Replay.find({
                roomId
            }).sort({
                createdAt: 1
            });

        res.status(200).json({
            message:
                "Replay fetched successfully",
            roomId,
            totalEvents: replay.length,
            replay
        });

    } catch (error) {
        console.error(
            "Get replay error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
}