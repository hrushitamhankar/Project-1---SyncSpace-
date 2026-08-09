const Room = require("../models/Room");
const User = require("../models/User");
const Replay = require("../models/Replay");

// =========================================
// CREATE ROOM
// =========================================
exports.createRoom = async (req, res) => {
    try {
        const { roomId } = req.body;

        // Get owner from logged-in user's JWT
        const ownerId = req.user.id || req.user._id;

        if (!roomId) {
            return res.status(400).json({
                message: "Room ID is required"
            });
        }

        // Check if room already exists
        const existingRoom = await Room.findOne({ roomId });

        if (existingRoom) {
            return res.status(400).json({
                message: "Room ID already exists"
            });
        }

        // Create room
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
        console.error("Create room error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================================
// INVITE USER
// =========================================
exports.inviteUser = async (req, res) => {
    try {
        const { roomId, email, role } = req.body;

        // Check required fields
        if (!roomId || !email) {
            return res.status(400).json({
                message: "Room ID and email are required"
            });
        }

        // Find room
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Get logged-in user
        const loggedInUserId = req.user.id || req.user._id;

        // Only room owner can invite
        if (
            room.ownerId.toString() !==
            loggedInUserId.toString()
        ) {
            return res.status(403).json({
                message: "Only the room owner can invite users"
            });
        }

        // Find invited user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Validate role
        const validRoles = ["viewer", "editor"];

        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role. Use viewer or editor."
            });
        }

        // Check if user is already invited
        const alreadyInvited = room.invitedUsers.some(
            (member) =>
                member.user.toString() ===
                user._id.toString()
        );

        if (alreadyInvited) {
            return res.status(400).json({
                message: "User is already invited"
            });
        }

        // Don't allow owner to be invited
        if (
            room.ownerId.toString() ===
            user._id.toString()
        ) {
            return res.status(400).json({
                message: "Room owner is already a member"
            });
        }

        // Add invited user
        room.invitedUsers.push({
            user: user._id,
            role: role || "viewer"
        });

        await room.save();

        res.status(200).json({
            message: "User invited successfully",
            room
        });

    } catch (error) {
        console.error("Invite user error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================================
// CHANGE USER ROLE
// =========================================
exports.changeUserRole = async (req, res) => {
    try {
        const { roomId, email, role } = req.body;

        // Check required fields
        if (!roomId || !email || !role) {
            return res.status(400).json({
                message: "Room ID, email and role are required"
            });
        }

        // Validate role
        if (!["editor", "viewer"].includes(role)) {
            return res.status(400).json({
                message: "Role must be editor or viewer"
            });
        }

        // Find room
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Get logged-in user
        const loggedInUserId = req.user.id || req.user._id;

        // Only owner can change roles
        if (
            room.ownerId.toString() !==
            loggedInUserId.toString()
        ) {
            return res.status(403).json({
                message: "Only the room owner can change user roles"
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Find invited member
        const member = room.invitedUsers.find(
            (item) =>
                item.user.toString() ===
                user._id.toString()
        );

        if (!member) {
            return res.status(404).json({
                message: "User is not invited to this room"
            });
        }

        // Change role
        member.role = role;

        await room.save();

        res.status(200).json({
            message: "User role updated successfully",
            room
        });

    } catch (error) {
        console.error("Change role error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================================
// GET MY ROOMS
// =========================================
exports.getMyRooms = async (req, res) => {
    try {
        // Get logged-in user from JWT
        const userId = req.user.id || req.user._id;

        // Find rooms owned by logged-in user
        const rooms = await Room.find({
            ownerId: userId
        }).populate(
            "invitedUsers.user",
            "name email"
        );

        res.status(200).json({
            message: "Rooms fetched successfully",
            rooms
        });

    } catch (error) {
        console.error("Get rooms error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};

// =========================================
// GET ROOM REPLAY
// =========================================
exports.getRoomReplay = async (req, res) => {
    try {
        const { roomId } = req.params;

        if (!roomId) {
            return res.status(400).json({
                message: "Room ID is required"
            });
        }

        // Find room
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Get logged-in user
        const userId = req.user.id || req.user._id;

        // Check owner
        const isOwner =
            room.ownerId.toString() === userId.toString();

        // Check invited user
        const isInvited = room.invitedUsers.some(
            (member) =>
                member.user.toString() === userId.toString()
        );

        // Only room members can see replay
        if (!isOwner && !isInvited) {
            return res.status(403).json({
                message: "You are not allowed to view this replay"
            });
        }

        // Get replay events
        const replay = await Replay.find({ roomId })
            .sort({ createdAt: 1 });

        res.status(200).json({
            message: "Replay fetched successfully",
            roomId,
            totalEvents: replay.length,
            replay
        });

    } catch (error) {
        console.error("Get replay error:", error);

        res.status(500).json({
            message: error.message
        });
    }
};