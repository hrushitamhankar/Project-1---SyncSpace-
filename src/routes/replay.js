import express from "express";

import {
    getReplayHistory
} from "../db/replayRepository.js";

const router = express.Router();

/**
 * Get replay history for a room.
 *
 * GET /api/replay/:roomId?limit=100
 */
router.get("/:roomId", async (req, res) => {

    const { roomId } = req.params;

    if (!roomId || roomId.trim().length === 0) {
        return res.status(400).json({
            error: "Invalid room ID"
        });
    }

    const requestedLimit = Number(req.query.limit);

    const limit =
        Number.isInteger(requestedLimit) &&
        requestedLimit > 0 &&
        requestedLimit <= 500
            ? requestedLimit
            : 100;

    try {

        const history = await getReplayHistory(
            roomId.trim(),
            limit
        );

        return res.status(200).json({
            roomId: roomId.trim(),
            count: history.length,
            limit,
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