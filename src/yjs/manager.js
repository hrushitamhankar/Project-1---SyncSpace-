import * as Y from "yjs";

import {
    getDocument,
    setDocument,
    removeDocument
} from "./documentManager.js";

import {
    getAwareness,
    removeAwareness
} from "./awareness.js";

import {
    saveDocument,
    loadDocument
} from "../db/yjsRepository.js";

import {
    saveReplaySnapshot as saveReplaySnapshotToDatabase,
    cleanupReplayHistory
} from "../db/replayRepository.js";

export function initializeRoom(roomId) {

    const doc =
        getDocument(roomId);

    const awareness =
        getAwareness(roomId);

    return {
        doc,
        awareness
    };
}

export function getRoomState(roomId) {

    return {
        doc: getDocument(roomId),
        awareness: getAwareness(roomId)
    };
}

/**
 * Restore persisted document.
 */
export async function restoreRoom(roomId) {

    const storedDocument =
        await loadDocument(roomId);

    if (!storedDocument) {

        return getDocument(roomId);
    }

    setDocument(
        roomId,
        storedDocument
    );

    console.log(
        `[YJS] Restored persisted room: ${roomId}`
    );

    return storedDocument;
}

/**
 * Persist current document.
 */
export async function persistRoom(roomId) {

    const doc =
        getDocument(roomId);

    await saveDocument(
        roomId,
        doc
    );

    console.log(
        `[YJS] Persisted room: ${roomId}`
    );
}

/**
 * Save replay snapshot.
 */
export async function saveReplaySnapshot(roomId) {

    const doc =
        getDocument(roomId);

    const update =
        Y.encodeStateAsUpdate(doc);

    await saveReplaySnapshotToDatabase(
        roomId,
        update
    );

    await cleanupReplayHistory(
        roomId,
        100
    );

    console.log(
        `[REPLAY] Snapshot saved: ${roomId}`
    );
}

/**
 * Persist + replay snapshot.
 */
export async function persistAndSnapshot(roomId) {

    await persistRoom(roomId);

    await saveReplaySnapshot(roomId);
}

/**
 * Destroy Yjs resources.
 */
export function destroyRoom(roomId) {

    removeAwareness(roomId);

    removeDocument(roomId);

    console.log(
        `[YJS] Destroyed room: ${roomId}`
    );
}