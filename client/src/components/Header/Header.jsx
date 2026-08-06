
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../services/socket";
import "./Header.css";

function Header() {
    const navigate = useNavigate();
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [roomId, setRoomId] = useState("");

    const handleJoinRoom = () => {
console.log("Join button clicked");
  if (!roomId.trim()) {
    alert("Please enter a Room ID");
    return;
  }

  socket.emit("joinRoom", roomId.trim());

};

const handleLeaveRoom = () => {
  const roomId = localStorage.getItem("roomId");

  if (!roomId) {
    alert("You are not in a room.");
    return;
  }

  socket.emit("leaveRoom", roomId);

  localStorage.removeItem("roomId");

  navigate("/");
};

useEffect(() => {
  
  socket.on("room-members", ({ roomId }) => {
  console.log("Received room-members:", roomId);

  localStorage.setItem("roomId", roomId);

  navigate("/room", {
    state: {
      roomId,
    },
  });
});


  return () => {
    socket.off("room-members");
  };
}, [navigate]);

useEffect(() => {
  socket.on("user-left", (data) => {
    console.log("User left:", data);
  });

  return () => {
    socket.off("user-left");
  };
}, []);

  return (
  <>
    <header className="header">
      <h2>SyncSpace</h2>

      <div>
        <button onClick={() => setShowJoinModal(true)}>
          Join Room
        </button>

        <button onClick={handleLeaveRoom}>
  Leave Room
</button>

      </div>
    </header>

    {showJoinModal && (
      <div className="modal-overlay">
        <div className="join-modal">

          <h2>Join Room</h2>

          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <div className="modal-buttons">

            <button onClick={() => setShowJoinModal(false)}>
              Cancel
            </button>

<button onClick={handleJoinRoom}>
  Join
</button>


          </div>

        </div>
      </div>
    )}
  </>
);
}

export default Header;