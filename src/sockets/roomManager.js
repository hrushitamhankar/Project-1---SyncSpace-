/**
 * In-memory storage for active rooms.
 * Key   -> roomId
 * Value -> Set of socket IDs
 */
const rooms = new Map();

/**
 * Add a socket to a room.
 *
 * @param {string} roomId - Room identifier
 * @param {string} socketId - Connected socket ID
 */
export function joinRoom(roomId, socketId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(socketId);
}

/**
 * Remove a socket from a room.
 *
 * @param {string} roomId - Room identifier
 * @param {string} socketId - Connected socket ID
 */
export function leaveRoom(roomId, socketId) {
    if (!rooms.has(roomId)) return;

    const members = rooms.get(roomId);

    members.delete(socketId);

    if (members.size === 0) {
        rooms.delete(roomId);
    }
}

/**
 * Remove a disconnected socket from every room.
 *
 * @param {string} socketId - Socket to remove
 * @returns {string[]} List of rooms the socket was removed from
 */
export function removeSocketFromAllRooms(socketId) {

    const leftRooms = [];

    for (const [roomId, members] of rooms.entries()) {

        if (members.has(socketId)) {

            members.delete(socketId);

            leftRooms.push(roomId);

            if (members.size === 0) {
                rooms.delete(roomId);
            }

        }

    }

    return leftRooms;
}

/**
 * Get all members currently present in a room.
 *
 * @param {string} roomId - Room identifier
 * @returns {string[]} Array of socket IDs
 */
export function getRoomMembers(roomId) {

    if (!rooms.has(roomId)) {
        return [];
    }

    return [...rooms.get(roomId)];

}