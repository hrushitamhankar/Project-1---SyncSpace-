import { io } from "socket.io-client";

const start = Date.now();
const SERVER_URL = "http://localhost:5000";

const TOTAL_CLIENTS = 25;

const sockets = [];

console.log(`Starting load test with ${TOTAL_CLIENTS} clients...\n`);

for (let i = 1; i <= TOTAL_CLIENTS; i++) {

    const socket = io(SERVER_URL);

    socket.on("connect", () => {

        console.log(
            `Client ${i} connected (${socket.id})`
        );

        socket.emit("joinRoom", "load-test-room");

    });

    socket.on("connect_error", (err) => {

        console.error(
            `Client ${i} failed: ${err.message}`
        );

    });

    sockets.push(socket);

}

setTimeout(() => {

    console.log("\nDisconnecting clients...\n");

    sockets.forEach((socket) => socket.disconnect());

    console.log(
        `Completed in ${(Date.now() - start) / 1000}s`
    );

}, 10000);