const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNzc3MWM5MjFmNTU4ODFjNzQyNzNjZSIsImlhdCI6MTc4NjI3OTc4NiwiZXhwIjoxNzg2ODg0NTg2fQ.K27aTJWGPj1EYPhvqsEq7E_43fydfpFiwo7-hLY070c";

const socket = io("http://localhost:5000", {
    auth: {
        token: token
    },
    transports: ["websocket"]
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit("joinRoom", "room104");
});

socket.on("joinSuccess", (data) => {
    console.log("JOIN SUCCESS:", data);

    if (data.role === "editor" || data.role === "owner") {
        console.log("Testing edit permission...");

        socket.emit("editRoom", {
            type: "draw",
            x: 100,
            y: 200
        });

        console.log("EDIT REQUEST SENT");
    } else {
        console.log("Viewer cannot send edit request");
    }
});

socket.on("permissionError", (data) => {
    console.log("PERMISSION ERROR:", data.message);
});

socket.on("roomEdited", (data) => {
    console.log("ROOM EDITED:", data);
});

socket.on("authError", (data) => {
    console.log("AUTH ERROR:", data.message);
});

socket.on("errorMessage", (data) => {
    console.log("ROOM ERROR:", data.message);
});

socket.on("connect_error", (error) => {
    console.log("CONNECTION ERROR:", error.message);
});