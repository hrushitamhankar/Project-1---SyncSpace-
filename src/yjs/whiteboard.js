import { getDocument } from "./documentManager.js";

/**
 * Get the shared whiteboard array for a room.
 */
export function getWhiteboard(roomId) {
    const doc = getDocument(roomId);

    return doc.getArray("whiteboard");
}