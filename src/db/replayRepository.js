import mongoose from "mongoose";

const replaySchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true
        },

        update: {
            type: Buffer,
            required: true
        },

        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        }
    },
    {
        collection: "yjs_replay_history"
    }
);

replaySchema.index({
    roomId: 1,
    timestamp: -1
});

const ReplayModel =
    mongoose.models.YjsReplay ||
    mongoose.model("YjsReplay", replaySchema);

export async function saveReplaySnapshot(roomId, update) {

    return ReplayModel.create({
        roomId,
        update: Buffer.from(update),
        timestamp: new Date()
    });
}

export async function getReplayHistory(roomId) {

    return ReplayModel
        .find({ roomId })
        .sort({ timestamp: 1 })
        .select("_id roomId timestamp")
        .lean();
}

export async function getReplayMetadata(roomId) {

    const snapshots = await ReplayModel
        .find({ roomId })
        .sort({ timestamp: 1 })
        .select("_id timestamp")
        .lean();

    return {
        roomId,
        count: snapshots.length,
        firstSnapshot:
            snapshots.length > 0
                ? snapshots[0].timestamp
                : null,
        lastSnapshot:
            snapshots.length > 0
                ? snapshots[snapshots.length - 1].timestamp
                : null
    };
}

export async function getReplaySnapshot(
    roomId,
    snapshotId
) {

    return ReplayModel.findOne({
        _id: snapshotId,
        roomId
    }).lean();
}

export async function deleteReplayHistory(roomId) {

    await ReplayModel.deleteMany({
        roomId
    });
}

export async function cleanupReplayHistory(
    roomId,
    keep = 100
) {

    const snapshots = await ReplayModel
        .find({ roomId })
        .sort({ timestamp: -1 })
        .select("_id")
        .lean();

    if (snapshots.length <= keep) {
        return;
    }

    const idsToDelete = snapshots
        .slice(keep)
        .map(snapshot => snapshot._id);

    await ReplayModel.deleteMany({
        _id: { $in: idsToDelete }
    });
}