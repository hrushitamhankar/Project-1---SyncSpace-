import { client } from "./mongo.js";
import { ObjectId } from "mongodb";

const COLLECTION_NAME = "yjs_replay_history";

/**
 * Get the MongoDB collection used for replay history.
 */
function getCollection() {
    const dbName = process.env.MONGODB_DB || "syncspace";

    return client
        .db(dbName)
        .collection(COLLECTION_NAME);
}

/**
 * Save a Yjs snapshot for replay.
 */
export async function saveReplaySnapshot(roomId, update) {

    if (!roomId || !update) {
        throw new Error("roomId and update are required");
    }

    await getCollection().insertOne({
        roomId,
        update: Buffer.from(update),
        timestamp: new Date()
    });

    console.log(
        `[REPLAY] Snapshot saved: ${roomId}`
    );
}

/**
 * Get ordered replay history for a room.
 */
export async function getReplayHistory(
    roomId,
    limit = 100
) {

    if (!roomId) {
        throw new Error("roomId is required");
    }

    return getCollection()
        .find({ roomId })
        .sort({ timestamp: 1 })
        .limit(limit)
        .toArray();
}

/**
 * Get replay metadata for a room.
 */
export async function getReplayMetadata(roomId) {

    if (!roomId) {
        throw new Error("roomId is required");
    }

    const snapshots = await getCollection()
        .find(
            { roomId },
            {
                projection: {
                    timestamp: 1
                }
            }
        )
        .sort({ timestamp: 1 })
        .toArray();

    return {
        count: snapshots.length,

        firstTimestamp:
            snapshots.length > 0
                ? snapshots[0].timestamp
                : null,

        lastTimestamp:
            snapshots.length > 0
                ? snapshots[snapshots.length - 1].timestamp
                : null
    };
}

/**
 * Get a single replay snapshot by ID.
 */
export async function getReplaySnapshot(
    roomId,
    snapshotId
) {

    if (!roomId || !snapshotId) {
        throw new Error(
            "roomId and snapshotId are required"
        );
    }

    if (!ObjectId.isValid(snapshotId)) {
        return null;
    }

    return getCollection().findOne({
        _id: new ObjectId(snapshotId),
        roomId
    });
}

/**
 * Remove replay history for a room.
 */
export async function clearReplayHistory(roomId) {

    if (!roomId) {
        throw new Error("roomId is required");
    }

    await getCollection().deleteMany({
        roomId
    });

    console.log(
        `[REPLAY] History cleared: ${roomId}`
    );
}

/**
 * Keep only the latest snapshots for a room.
 */
export async function trimReplayHistory(
    roomId,
    maxSnapshots = 100
) {

    if (!roomId) {
        throw new Error("roomId is required");
    }

    const collection = getCollection();

    const snapshots = await collection
        .find(
            { roomId },
            {
                projection: {
                    _id: 1
                }
            }
        )
        .sort({
            timestamp: -1
        })
        .skip(maxSnapshots)
        .toArray();

    if (snapshots.length === 0) {
        return;
    }

    const ids = snapshots.map(
        (snapshot) => snapshot._id
    );

    await collection.deleteMany({
        _id: {
            $in: ids
        }
    });

    console.log(
        `[REPLAY] Trimmed ${snapshots.length} old snapshots: ${roomId}`
    );
}