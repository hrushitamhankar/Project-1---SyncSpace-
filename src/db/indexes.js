import { client } from "./mongo.js";

const DB_NAME = process.env.MONGODB_DB || "syncspace";

/**
 * Create indexes required by Yjs persistence and replay history.
 */
export async function createIndexes() {

    const db = client.db(DB_NAME);

    await db
        .collection("yjs_documents")
        .createIndex(
            { roomId: 1 },
            { unique: true }
        );

    await db
        .collection("yjs_replay_history")
        .createIndex(
            { roomId: 1, timestamp: 1 }
        );

    console.log("[MONGO] Database indexes created");
}