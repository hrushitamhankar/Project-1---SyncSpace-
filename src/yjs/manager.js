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

const SNAPSHOT_INTERVAL = 5000;

const snapshotTimers = new Map();

/**
 * Initialize a Yjs room.
 */
export function initializeRoom(roomId) {

    const doc = getDocument(roomId);
    const awareness = getAwareness(roomId);

    if (!doc.__replayListenerAttached) {

        doc.on("update", () => {

            if (snapshotTimers.has(roomId)) {
                return;
            }

            const timer = setTimeout(async () => {

                snapshotTimers.delete(roomId);

                try {
                    await saveReplaySnapshot(roomId);
                } catch (error) {
                    console.error(
                        `[REPLAY] Failed to save snapshot for ${roomId}:`,
                        error
                    );
                }

            }, SNAPSHOT_INTERVAL);

            snapshotTimers.set(roomId, timer);
        });

        doc.__replayListenerAttached = true;

        console.log(
            `[REPLAY] Periodic snapshot listener attached: ${roomId}`
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
 * Save the current Yjs document as a replay snapshot.
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
 * Save the final replay snapshot before destroying the room.
 */
export async function finalizeReplaySnapshot(roomId) {

    const timer = snapshotTimers.get(roomId);

    if (timer) {
        clearTimeout(timer);
        snapshotTimers.delete(roomId);
    }

    try {
        await saveReplaySnapshot(roomId);
    } catch (error) {
        console.error(
            `[REPLAY] Failed to save final snapshot for ${roomId}:`,
            error
        );
    }
}

/**
 * Destroy all Yjs resources for a room.
 */
export function destroyRoom(roomId) {

    const timer = snapshotTimers.get(roomId);

    if (timer) {
        clearTimeout(timer);
        snapshotTimers.delete(roomId);
    }

    removeAwareness(roomId);
    removeDocument(roomId);

    console.log(
        `[YJS] Destroyed room: ${roomId}`
    );
}