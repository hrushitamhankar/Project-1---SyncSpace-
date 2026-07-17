const Room = require("../models/Room");
const User = require("../models/User");

exports.createRoom = async (req, res) => {
  try {
    const { roomId, ownerId } = req.body;

    const room = await Room.create({
      roomId,
      ownerId,
      invitedUsers: [],
    });

    res.status(201).json({
      message: "Room Created Successfully",
      room,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.inviteUser = async (req, res) => {
  try {
    const { roomId, email } = req.body;

    // Find room
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Add user to invitedUsers array
    room.invitedUsers.push(user._id);

    await room.save();

    res.status(200).json({
      message: "User invited successfully",
      room,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
exports.getMyRooms = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const rooms = await Room.find({ ownerId }).populate(
      "invitedUsers",
      "name email"
    );

    res.status(200).json({
      message: "Rooms fetched successfully",
      rooms,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};