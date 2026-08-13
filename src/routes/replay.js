import express from "express";

import {
    getReplayHistory,
    getReplayMetadata,
    getReplaySnapshot
} from "../db/replayRepository.js";

const router = express.Router();

/**
 * Get replay metadata for a room.
 *
 * GET /api/replay/:roomId/metadata
 */
router.get("/:roomId/metadata", async (req, res) => {

    const { roomId } = req.params;

    if (!roomId || roomId.trim().length === 0) {

        return res.status(400).json({
            error: "Invalid room ID"
        });
    }

    try {

        const metadata = await getReplayMetadata(
            roomId.trim()
        );

        return res.status(200).json({
            roomId: roomId.trim(),
            ...metadata
        });

    } catch (error) {

        console.error(
            "[REPLAY] Failed to fetch metadata:",
            error
        );

        return res.status(500).json({
            error: "Failed to fetch replay metadata"
        });
    }
});

/**
 * Get a single replay snapshot.
 *
 * GET /api/replay/:roomId/snapshot/:snapshotId
 */
router.get(
    "/:roomId/snapshot/:snapshotId",
    async (req, res) => {

        const {
            roomId,
            snapshotId
        } = req.params;

        if (!roomId || roomId.trim().length === 0) {

            return res.status(400).json({
                error: "Invalid room ID"
            });
        }

        try {

            const snapshot =
                await getReplaySnapshot(
                    roomId.trim(),
                    snapshotId
                );

            if (!snapshot) {

                return res.status(404).json({
                    error: "Replay snapshot not found"
                });
            }

            return res.status(200).json({
                id: snapshot._id,
                roomId: snapshot.roomId,
                timestamp: snapshot.timestamp,
                update: snapshot.update.toString("base64")
            });

        } catch (error) {

            console.error(
                "[REPLAY] Failed to fetch snapshot:",
                error
            );

            return res.status(500).json({
                error: "Failed to fetch replay snapshot"
            });
        }
    }
);

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

    const requestedLimit =
        Number(req.query.limit);

    const limit =
        Number.isInteger(requestedLimit) &&
        requestedLimit > 0 &&
        requestedLimit <= 500
            ? requestedLimit
            : 100;

    try {

        const history =
            await getReplayHistory(
                roomId.trim(),
                limit
            );

        return res.status(200).json({
            roomId: roomId.trim(),
            count: history.length,
            limit,

            history: history.map(
                (snapshot) => ({
                    id: snapshot._id,
                    timestamp: snapshot.timestamp,
                    update:
                        snapshot.update.toString(
                            "base64"
                        )
                })
            )
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