export function validateRoom(roomId, socket) {

    if (
        typeof roomId !== "string" ||
        roomId.trim().length === 0
    ) {

        socket.emit("room-error", {
            message: "Invalid room ID"
        });

        return false;
    }

    return true;

}