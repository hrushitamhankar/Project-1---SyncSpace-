// roomId -> Set(socketIds)
const rooms = new Map();

/**
 * Add socket to room
 */
export function joinRoom(roomId, socketId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(socketId);
}

/**
 * Remove socket from room
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
 * Remove socket from every room
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
 * Get members of a room
 */
export function getRoomMembers(roomId) {
    if (!rooms.has(roomId)) {
        return [];
    }

    return [...rooms.get(roomId)];
}