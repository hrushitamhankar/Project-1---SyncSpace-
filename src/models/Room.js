import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    invitedUsers: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            role: {
                type: String,
                enum: [
                    "editor",
                    "viewer"
                ],
                default: "viewer"
            }
        }
    ]
});

export default mongoose.model(
    "Room",
    roomSchema
);