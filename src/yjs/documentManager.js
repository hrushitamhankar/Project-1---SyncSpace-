import * as Y from "yjs";

const documents = new Map();

/**
 * Returns an existing Y.Doc or creates a new one.
 */
export function getDocument(roomId) {
    if (!documents.has(roomId)) {
        const doc = new Y.Doc();
        documents.set(roomId, doc);

        console.log(`[YJS] Created document for room: ${roomId}`);
    }

    return documents.get(roomId);
}


/**
 * Store a restored Y.Doc in memory.
 */
export function setDocument(roomId, doc) {
    documents.set(roomId, doc);

    console.log(`[YJS] Restored document for room: ${roomId}`);

    return doc;
}

/**
 * Remove document when room is destroyed.
 */
export function removeDocument(roomId) {
    if (!documents.has(roomId)) return;

    documents.get(roomId).destroy();
    documents.delete(roomId);

    console.log(`[YJS] Removed document: ${roomId}`);
}

/**
 * Returns every active document.
 */
export function getDocuments() {
    return documents;
}
