import * as Y from "yjs";
import { Binary } from "mongodb";
import { client } from "./mongo.js";

const COLLECTION_NAME = "yjs_documents";

/**
 * Get the MongoDB collection used for Yjs documents.
 */
function getCollection() {
    const dbName = process.env.MONGODB_DB || "syncspace";

    return client
        .db(dbName)
        .collection(COLLECTION_NAME);
}

/**
 * Save the complete Yjs document state for a room.
 *
 * The Y.Doc is converted into a binary update
 * before being stored in MongoDB.
 */
export async function saveDocument(roomId, doc) {

    if (!roomId || !doc) {
        throw new Error("roomId and doc are required");
    }

    const update = Y.encodeStateAsUpdate(doc);

    await getCollection().updateOne(
        { roomId },
        {
            $set: {
                roomId,
                state: new Binary(Buffer.from(update)),
                updatedAt: new Date()
            }
        },
        { upsert: true }
    );

    console.log(`[YJS] Document persisted: ${roomId}`);
}

/**
 * Load a previously persisted Yjs document.
 *
 * Returns null when no saved document exists.
 */
export async function loadDocument(roomId) {

    if (!roomId) {
        throw new Error("roomId is required");
    }

    const storedDocument = await getCollection().findOne({
        roomId
    });

    if (!storedDocument) {
        console.log(`[YJS] No persisted document: ${roomId}`);
        return null;
    }

    const doc = new Y.Doc();

    const update = storedDocument.state.buffer;

    Y.applyUpdate(doc, update);

    console.log(`[YJS] Document restored: ${roomId}`);

    return doc;
}

/**
 * Check whether a persisted Yjs document exists.
 */
export async function documentExists(roomId) {

    const document = await getCollection().findOne(
        { roomId },
        { projection: { _id: 1 } }
    );

    return !!document;
}