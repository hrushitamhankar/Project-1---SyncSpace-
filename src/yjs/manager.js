    import { getDocument } from "./documentManager.js";
    import { getAwareness } from "./awareness.js";

    /**
     * Initialize a Yjs room.
     *
     * Creates (or retrieves) the room's Y.Doc and Awareness instance.
     *
     * @param {string} roomId
     * @returns {{ doc: import("yjs").Doc, awareness: import("y-protocols/awareness").Awareness }}
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