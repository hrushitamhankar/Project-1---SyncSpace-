import express from "express";

import {
    getReplayHistory
} from "../db/replayRepository.js";

const router = express.Router();

/**
 * Get replay history for a room.
 *
 * GET /api/replay/:roomId
 */
router.get("/:roomId", async (req, res) => {

    const { roomId } = req.params;

    if (!roomId || roomId.trim().length === 0) {
        return res.status(400).json({
            error: "Invalid room ID"
        });
    }

    try {

        const history = await getReplayHistory(
            roomId.trim()
        );

        return res.status(200).json({
            roomId: roomId.trim(),
            count: history.length,
            history: history.map((snapshot) => ({
                id: snapshot._id,
                timestamp: snapshot.timestamp,
                update: snapshot.update.toString("base64")
            }))
        });

    } catch (error) {

        console.error(
            "[REPLAY] Failed to fetch history:",
            error
        );

        return res.status(500).json({
            error: "Failed to fetch replay history"
        });
    }
});

export default router;