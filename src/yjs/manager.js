import * as Y from "yjs";

import {
    getDocument,
    setDocument
} from "./documentManager.js";

import { getAwareness } from "./awareness.js";

import { removeDocument } from "./documentManager.js";
import { removeAwareness } from "./awareness.js";

import {
    saveDocument,
    loadDocument
} from "../db/yjsRepository.js";

import {
    saveReplaySnapshot as saveReplaySnapshotToDatabase
} from "../db/replayRepository.js";

/**
 * Initialize a Yjs room.
 *
 * Creates or retrieves the room's Y.Doc
 * and Awareness instance.
 *
 * @param {string} roomId
 * @returns {{
 *   doc: import("yjs").Doc,
 *   awareness: import("y-protocols/awareness").Awareness
 * }}
 */
export function initializeRoom(roomId) {

    const doc = getDocument(roomId);
    const awareness = getAwareness(roomId);

    // B2: Listen for Yjs document updates
    if (!doc.__replayListenerAttached) {

        doc.on("update", async () => {

            try {

                await saveReplaySnapshot(roomId);

            } catch (error) {

                console.error(
                    `[REPLAY] Failed to save snapshot for ${roomId}:`,
                    error
                );

            }

        });

        // Prevent duplicate listeners
        doc.__replayListenerAttached = true;

        console.log(
            `[REPLAY] Update listener attached: ${roomId}`
        );
    }

    return {
        doc,
        awareness
    };
}

/**
 * Get current room state.
 */
export function getRoomState(roomId) {

    return {
        doc: getDocument(roomId),
        awareness: getAwareness(roomId)
    };
}

/**
 * Restore a Yjs document from MongoDB.
 *
 * If no persisted document exists,
 * a new in-memory document is created.
 */
export async function restoreRoom(roomId) {

    const storedDocument = await loadDocument(roomId);

    if (!storedDocument) {

        return getDocument(roomId);
    }

    setDocument(roomId, storedDocument);

    console.log(
        `[YJS] Restored persisted room: ${roomId}`
    );

    return storedDocument;
}

/**
 * Persist the current Yjs document to MongoDB.
 */
export async function persistRoom(roomId) {

    const doc = getDocument(roomId);

    await saveDocument(
        roomId,
        doc
    );

    console.log(
        `[YJS] Persisted room: ${roomId}`
    );
}

/**
 * Save the current Yjs document state
 * as a replay snapshot.
 */
export async function saveReplaySnapshot(roomId) {

    const doc = getDocument(roomId);

    const update = Y.encodeStateAsUpdate(doc);

    await saveReplaySnapshotToDatabase(
        roomId,
        update
    );

    console.log(
        `[REPLAY] Snapshot created: ${roomId}`
    );
}

/**
 * Destroy all Yjs resources for a room.
 */
export function destroyRoom(roomId) {

    removeAwareness(roomId);
    removeDocument(roomId);

    console.log(
        `[YJS] Destroyed room: ${roomId}`
    );
}