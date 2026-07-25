import { Awareness } from "y-protocols/awareness.js";
import { getDocument } from "./documentManager.js";

const awarenessMap = new Map();

/**
 * Returns Awareness instance for a room.
 */
export function getAwareness(roomId) {
    if (!awarenessMap.has(roomId)) {
        const doc = getDocument(roomId);

        awarenessMap.set(
            roomId,
            new Awareness(doc)
        );

        console.log(
            `[YJS] Awareness created for ${roomId}`
        );
    }

    return awarenessMap.get(roomId);
}

/**
 * Remove Awareness when room is destroyed.
 */
export function removeAwareness(roomId) {
    awarenessMap.delete(roomId);
}