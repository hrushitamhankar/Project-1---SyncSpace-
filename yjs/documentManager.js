const Y = require("yjs");

const documents = new Map();

/**
 * Get existing Y.Doc or create a new one.
 */
function getDocument(roomId) {
    if (!documents.has(roomId)) {
        documents.set(roomId, new Y.Doc());
        console.log(`[YJS] Created document: ${roomId}`);
    }

    return documents.get(roomId);
}

/**
 * Remove a room document.
 */
function removeDocument(roomId) {
    documents.delete(roomId);
}

/**
 * Get all active documents.
 */
function getDocuments() {
    return documents;
}

module.exports = {
    getDocument,
    removeDocument,
    getDocuments
};