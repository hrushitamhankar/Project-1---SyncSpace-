import * as Y from "yjs";
import socket from "./socket";

export const ydoc = new Y.Doc();

export const whiteboard = ydoc.getArray("whiteboard");

ydoc.on("update", (update, origin) => {
  // Don't send updates back to the server when
  // they came from another client.
  if (origin === "remote") return;

  const roomId = localStorage.getItem("roomId");

  if (!roomId) return;

  socket.emit("yjs-update", {
    roomId,
    update: Array.from(update),
  });
});

socket.on("yjs-update", (data) => {
  const roomId = localStorage.getItem("roomId");

  if (!data || data.roomId !== roomId) return;

  const update = new Uint8Array(data.update);

  Y.applyUpdate(ydoc, update, "remote");
});

socket.on("yjs-sync", (data) => {
    const roomId = localStorage.getItem("roomId");

    if (!data || data.roomId !== roomId) return;

    const update = new Uint8Array(data.update);

    Y.applyUpdate(ydoc, update, "remote");

    console.log("[YJS] Initial whiteboard state restored");
});