const mongoose = require("mongoose");

const replaySchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        role: {
            type: String,
            enum: ["owner", "editor", "viewer"],
            required: true
        },

        eventType: {
            type: String,
            required: true
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Replay", replaySchema);