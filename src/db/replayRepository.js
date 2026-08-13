import { client } from "./mongo.js";

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
 *
 * @param {string} roomId
 * @param {Uint8Array} update
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
 *
 * @param {string} roomId
 * @returns {Promise<Array>}
 */
export async function getReplayHistory(roomId) {

    if (!roomId) {
        throw new Error("roomId is required");
    }

    return getCollection()
        .find({ roomId })
        .sort({ timestamp: 1 })
        .toArray();
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