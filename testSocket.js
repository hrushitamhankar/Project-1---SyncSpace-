const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNTkxZDBmZDY2MjQ2MDkwZDNjZjgzZiIsImlhdCI6MTc4NjIwNzUxNiwiZXhwIjoxNzg2ODEyMzE2fQ.tvlr-gbE8HEQrsYQ2XFpQ7qXXJDy5M7NL1cSCZYSra8";

const socket = io("http://localhost:5000", {
  auth: {
    token: token
  },
  transports: ["polling", "websocket"]
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("joinRoom", "room104");
});

socket.on("joinSuccess", (data) => {
  console.log("JOIN SUCCESS:", data);
});

socket.on("errorMessage", (data) => {
  console.log("ROOM ERROR:", data.message);
});

socket.on("authError", (data) => {
  console.log("AUTH ERROR:", data.message);
});

socket.on("connect_error", (error) => {
  console.log("CONNECTION ERROR:", error.message);
});