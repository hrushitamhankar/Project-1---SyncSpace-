/**
 * Awareness State Manager
 *
 * Stores temporary awareness information
 * for each collaborative room.
 *
 * NOTE:
 * This data is stored in memory only.
 * It will be lost when the server restarts.
 */

const awarenessRooms = new Map();

/**
 * Ensure a room exists.
 *
 * @param {string} roomId
 */
function ensureRoom(roomId) {
    if (!awarenessRooms.has(roomId)) {
        awarenessRooms.set(roomId, new Map());
    }
}

/**
 * Store or update awareness information
 * for a socket in a room.
 *
 * @param {string} roomId
 * @param {string} socketId
 * @param {Object} awareness
 */
export function updateAwareness(roomId, socketId, awareness) {

    ensureRoom(roomId);

    awarenessRooms
        .get(roomId)
        .set(socketId, awareness);

}

/**
 * Remove awareness for a socket
 * from a specific room.
 *
 * @param {string} roomId
 * @param {string} socketId
 */
export function removeAwareness(roomId, socketId) {

    if (!awarenessRooms.has(roomId)) return;

    const room = awarenessRooms.get(roomId);

    room.delete(socketId);

    if (room.size === 0) {
        awarenessRooms.delete(roomId);
    }

}

/**
 * Get awareness state of all users
 * in a room.
 *
 * @param {string} roomId
 * @returns {Object[]}
 */
export function getRoomAwareness(roomId) {

    if (!awarenessRooms.has(roomId)) {
        return [];
    }

    return [...awarenessRooms.get(roomId).values()];

}

/**
 * Remove awareness information for a socket
 * from every room.
 *
 * @param {string} socketId
 */
export function removeSocketAwareness(socketId) {

    for (const [roomId, users] of awarenessRooms.entries()) {

        users.delete(socketId);

        if (users.size === 0) {
            awarenessRooms.delete(roomId);
        }

    }

}