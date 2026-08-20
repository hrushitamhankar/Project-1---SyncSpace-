import express from "express";

import {
    getReplayHistory,
    getReplayMetadata,
    getReplaySnapshot
} from "../db/replayRepository.js";

const router = express.Router();

/**
 * GET /api/replay/:roomId
 *
 * Returns replay snapshot history.
 */
router.get("/:roomId", async (req, res) => {

    try {

        const history =
            await getReplayHistory(
                req.params.roomId
            );

        res.json({
            roomId: req.params.roomId,
            snapshots: history
        });

    } catch (error) {

        console.error(
            "[REPLAY] History error:",
            error.message
        );

        res.status(500).json({
            message: "Failed to load replay history"
        });
    }
});

/**
 * GET /api/replay/:roomId/metadata
 */
router.get(
    "/:roomId/metadata",
    async (req, res) => {

        try {

            const metadata =
                await getReplayMetadata(
                    req.params.roomId
                );

            res.json(metadata);

        } catch (error) {

            console.error(
                "[REPLAY] Metadata error:",
                error.message
            );

            res.status(500).json({
                message: "Failed to load replay metadata"
            });
        }
    }
);

/**
 * GET /api/replay/:roomId/snapshot/:snapshotId
 */
router.get(
    "/:roomId/snapshot/:snapshotId",
    async (req, res) => {

        try {

            const snapshot =
                await getReplaySnapshot(
                    req.params.roomId,
                    req.params.snapshotId
                );

            if (!snapshot) {

                return res.status(404).json({
                    message: "Replay snapshot not found"
                });
            }

            res.json({
                roomId: snapshot.roomId,
                snapshotId: snapshot._id,
                timestamp: snapshot.timestamp,
                update: Buffer
                    .from(snapshot.update)
                    .toString("base64")
            });

        } catch (error) {

            console.error(
                "[REPLAY] Snapshot error:",
                error.message
            );

            res.status(500).json({
                message: "Failed to load replay snapshot"
            });
        }
    }
);

export default router;