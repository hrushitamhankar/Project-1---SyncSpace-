const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
    auth: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNTkxZDBmZDY2MjQ2MDkwZDNjZjgzZiIsImlhdCI6MTc4NDY1NzQyOSwiZXhwIjoxNzg1MjYyMjI5fQ.4htLsXA037ixmPnZAcfFcPw64gmja6xffn0AuHxTw8w"
    }
});

socket.on("connect", () => {

    console.log("Connected:", socket.id);

    // Replace with an actual room ID from MongoDB
    socket.emit("joinRoom", "6a5fb18aa6a3d9e8d0d864d4");

});

socket.on("joined", (msg) => {
    console.log("SUCCESS:", msg);
});

socket.on("user-joined", (user) => {
    console.log("User Joined:", user);
});

socket.on("error", (msg) => {
    console.log("ERROR:", msg);
});

socket.on("disconnect", () => {
    console.log("Disconnected");
});