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

/**
 * Initialize a Yjs room.
 *
 * Creates (or retrieves) the room's Y.Doc and Awareness instance.
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
 * Destroy all Yjs resources for a room.
 */
export function destroyRoom(roomId) {

    removeAwareness(roomId);
    removeDocument(roomId);

    console.log(
        `[YJS] Destroyed room: ${roomId}`
    );
}