import mongoose from "mongoose";
import * as Y from "yjs";

const documentSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        update: {
            type: Buffer,
            required: true
        }
    },
    {
        timestamps: true,
        collection: "yjs_documents"
    }
);

const DocumentModel =
    mongoose.models.YjsDocument ||
    mongoose.model("YjsDocument", documentSchema);

export async function saveDocument(roomId, doc) {
    const update = Y.encodeStateAsUpdate(doc);

    await DocumentModel.findOneAndUpdate(
        { roomId },
        {
            roomId,
            update: Buffer.from(update)
        },
        {
            upsert: true,
            new: true
        }
    );
}

export async function loadDocument(roomId) {
    const stored = await DocumentModel.findOne({ roomId });

    if (!stored) {
        return null;
    }

    const doc = new Y.Doc();

    Y.applyUpdate(
        doc,
        new Uint8Array(stored.update)
    );

    return doc;
}

export async function deleteDocument(roomId) {
    await DocumentModel.deleteOne({ roomId });
}

export async function getDocumentMetadata(roomId) {
    return DocumentModel.findOne(
        { roomId },
        {
            roomId: 1,
            createdAt: 1,
            updatedAt: 1
        }
    ).lean();
}