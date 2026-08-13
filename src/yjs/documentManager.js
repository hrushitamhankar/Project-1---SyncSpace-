import * as Y from "yjs";

const documents = new Map();

export function getDocument(roomId) {

    if (!documents.has(roomId)) {

        const doc = new Y.Doc();

        documents.set(
            roomId,
            doc
        );

        console.log(
            `[YJS] Created document: ${roomId}`
        );
    }

    return documents.get(roomId);
}

export function setDocument(roomId, doc) {

    const existing =
        documents.get(roomId);

    if (existing) {
        existing.destroy();
    }

    documents.set(
        roomId,
        doc
    );

    console.log(
        `[YJS] Restored document: ${roomId}`
    );

    return doc;
}

export function removeDocument(roomId) {

    const doc =
        documents.get(roomId);

    if (!doc) {
        return;
    }

    doc.destroy();

    documents.delete(roomId);

    console.log(
        `[YJS] Removed document: ${roomId}`
    );
}

export function getDocuments() {
    return documents;
}