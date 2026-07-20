/**
 * Awareness State Manager
 */

const awarenessRooms = new Map();

function ensureRoom(roomId) {
    if (!awarenessRooms.has(roomId)) {
        awarenessRooms.set(roomId, new Map());
    }
}

export function updateAwareness(roomId, socketId, awareness) {

    ensureRoom(roomId);

    awarenessRooms
        .get(roomId)
        .set(socketId, awareness);

}

export function removeAwareness(roomId, socketId) {

    if (!awarenessRooms.has(roomId)) return;

    const room = awarenessRooms.get(roomId);

    room.delete(socketId);

    if (room.size === 0) {
        awarenessRooms.delete(roomId);
    }

}

export function getRoomAwareness(roomId) {

    if (!awarenessRooms.has(roomId)) {
        return [];
    }

    return [...awarenessRooms.get(roomId).values()];

}

/**
 * NEW
 * Get awareness of one socket.
 */
export function getUserAwareness(roomId, socketId) {

    if (!awarenessRooms.has(roomId)) {
        return null;
    }

    return awarenessRooms
        .get(roomId)
        .get(socketId);

}

export function removeSocketAwareness(socketId) {

    for (const [roomId, users] of awarenessRooms.entries()) {

        users.delete(socketId);

        if (users.size === 0) {
            awarenessRooms.delete(roomId);
        }

    }

}