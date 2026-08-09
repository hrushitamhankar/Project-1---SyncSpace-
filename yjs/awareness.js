const awarenessStore = new Map();

/**
 * Update awareness of a user.
 */
function updateAwareness(roomId, socketId, data) {

    if (!awarenessStore.has(roomId)) {
        awarenessStore.set(roomId, new Map());
    }

    awarenessStore.get(roomId).set(socketId, data);

}

/**
 * Get awareness for a room.
 */
function getAwareness(roomId) {

    if (!awarenessStore.has(roomId)) {
        return [];
    }

    return Array.from(
        awarenessStore.get(roomId).values()
    );

}

/**
 * Remove awareness when a user disconnects.
 */
function removeAwareness(roomId, socketId) {

    if (!awarenessStore.has(roomId)) return;

    awarenessStore.get(roomId).delete(socketId);

}

module.exports = {
    updateAwareness,
    getAwareness,
    removeAwareness
};