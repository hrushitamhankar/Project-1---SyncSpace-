const Y = require("yjs");

const rooms = new Map();

function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            doc: new Y.Doc(),
            users: new Set(),
        });
    }

    return rooms.get(roomId);
}

function emitUserCount(io, roomId) {
    const room = rooms.get(roomId);

    if (!room) return;

    io.to(roomId).emit("room-users", room.users.size);
}

function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log("[SOCKET] Connected:", socket.id);

        // =========================
        // CODE EDITOR
        // =========================

        socket.on("join-room", (data) => {
            const roomId =
                typeof data === "string"
                    ? data
                    : data?.roomId;

            if (!roomId) return;

            const room = getRoom(roomId);

            socket.join(roomId);
            room.users.add(socket.id);

            socket.data.codeRoom = roomId;

            console.log(
                `[CODE] ${socket.id} joined ${roomId}`
            );

            const state =
                Y.encodeStateAsUpdate(room.doc);

            socket.emit("yjs-state", {
                roomId,
                update: Array.from(state),
            });

            emitUserCount(io, roomId);
        });

        socket.on("yjs-update", (data) => {
            if (!data?.roomId || !data?.update) {
                return;
            }

            const room =
                rooms.get(data.roomId);

            if (!room) return;

            try {
                const update =
                    new Uint8Array(data.update);

                Y.applyUpdate(
                    room.doc,
                    update
                );

                socket
                    .to(data.roomId)
                    .emit("yjs-update", {
                        roomId: data.roomId,
                        update: Array.from(update),
                    });

            } catch (error) {
                console.error(
                    "[CODE] Yjs error:",
                    error.message
                );
            }
        });

        // =========================
        // WHITEBOARD
        // =========================

        socket.on(
            "joinWhiteboard",
            (roomId) => {
                if (!roomId) return;

                socket.join(roomId);

                socket.data.whiteboardRoom =
                    roomId;

                console.log(
                    `[WHITEBOARD] ${socket.id} joined ${roomId}`
                );

                socket.to(roomId).emit(
                    "whiteboard-user-joined",
                    {
                        socketId: socket.id,
                    }
                );
            }
        );

        socket.on(
            "whiteboard-draw",
            (data) => {
                if (
                    !data ||
                    !data.roomId ||
                    !data.from ||
                    !data.to
                ) {
                    return;
                }

                // Send drawing stroke to
                // every OTHER client
                socket
                    .to(data.roomId)
                    .emit(
                        "whiteboard-draw",
                        {
                            from: data.from,
                            to: data.to,
                            color: data.color,
                            size: data.size,
                        }
                    );
            }
        );

        socket.on(
            "whiteboard-clear",
            (data) => {
                if (!data?.roomId) {
                    return;
                }

                // Clear every other client's board
                socket
                    .to(data.roomId)
                    .emit(
                        "whiteboard-clear"
                    );
            }
        );

        socket.on(
            "leaveWhiteboard",
            (roomId) => {
                if (!roomId) return;

                socket.leave(roomId);

                console.log(
                    `[WHITEBOARD] ${socket.id} left ${roomId}`
                );
            }
        );

        // =========================
        // GENERAL LEAVE
        // =========================

        socket.on(
            "leave-room",
            (data) => {
                const roomId =
                    typeof data === "string"
                        ? data
                        : data?.roomId;

                if (!roomId) return;

                socket.leave(roomId);

                const room =
                    rooms.get(roomId);

                if (room) {
                    room.users.delete(
                        socket.id
                    );

                    emitUserCount(
                        io,
                        roomId
                    );

                    if (
                        room.users.size === 0
                    ) {
                        room.doc.destroy();

                        rooms.delete(
                            roomId
                        );
                    }
                }
            }
        );

        // =========================
        // DISCONNECT
        // =========================

        socket.on(
            "disconnect",
            () => {
                const codeRoom =
                    socket.data.codeRoom;

                if (codeRoom) {
                    const room =
                        rooms.get(codeRoom);

                    if (room) {
                        room.users.delete(
                            socket.id
                        );

                        emitUserCount(
                            io,
                            codeRoom
                        );

                        if (
                            room.users.size === 0
                        ) {
                            room.doc.destroy();

                            rooms.delete(
                                codeRoom
                            );
                        }
                    }
                }

                console.log(
                    "[SOCKET] Disconnected:",
                    socket.id
                );
            }
        );
    });
}

module.exports = setupSocket;