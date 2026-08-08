const Room = require("../models/Room");
const User = require("../models/User");

// =========================================
// CREATE ROOM
// =========================================
exports.createRoom = async (req, res) => {
    try {
        const { roomId } = req.body;

        // Get logged-in user's ID from JWT
        const ownerId = req.user.id || req.user._id;

        if (!roomId) {
            return res.status(400).json({
                message: "Room ID is required"
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

        // Find room
        const room = await Room.findOne({ roomId });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        // Find user
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

        // Check duplicate invitation
        const alreadyInvited = room.invitedUsers.some(
            (member) =>
                member.user.toString() === user._id.toString()
        );

        if (alreadyInvited) {
            return res.status(400).json({
                message: "User is already invited"
            });
        }

        // Add user with role
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
        const ownerId = req.user.id || req.user._id;

        const rooms = await Room.find({ ownerId })
            .populate("invitedUsers.user", "name email");

        res.status(200).json({
            message: "Rooms fetched successfully",
            rooms
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};