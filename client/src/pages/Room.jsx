import "./Room.css";

import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import Sidebar from "../components/Sidebar/Sidebar";
import Whiteboard from "../components/Whiteboard/Whiteboard";
import CodeEditor from "../components/CodeEditor/CodeEditor";
import socket from "../services/socket";

function Room() {

const { state } = useLocation();

const roomId = localStorage.getItem("roomId");

console.log("Room from localStorage:", roomId);

    const [clearCanvas, setClearCanvas] = useState(false);
  const [tool, setTool] = useState("pen");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
const [whiteboardWidth, setWhiteboardWidth] = useState(600);
const isDragging = useRef(false);

const [showTextModal, setShowTextModal] = useState(false);
const [textValue, setTextValue] = useState("");
const [textPosition, setTextPosition] = useState(null);
const [pendingText, setPendingText] = useState(null);


useEffect(() => {
    console.log("Current Room:", roomId);
  }, [roomId]);

useEffect(() => {
  if (!roomId) return;

  const handleConnect = () => {
    console.log("Socket connected. Rejoining:", roomId);

    socket.emit("rejoin-room", roomId);
  };

  socket.on("connect", handleConnect);

  // If already connected, emit immediately
  if (socket.connected) {
    handleConnect();
  }

  return () => {
    socket.off("connect", handleConnect);
  };
}, [roomId]);

useEffect(() => {
  socket.on("room-restored", (data) => {
    console.log("Room restored:", data);
  });

  return () => {
    socket.off("room-restored");
  };
}, []);

useEffect(() => {
  
  socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });

  return () => {
    socket.off("connect");
  };
}, []);

const handleMouseDown = () => {
  isDragging.current = true;
};

const handleMouseMove = (e) => {
  if (!isDragging.current) return;

  setWhiteboardWidth(e.clientX - 220);
};

const handleMouseUp = () => {
  isDragging.current = false;
};

window.onmousemove = handleMouseMove;
window.onmouseup = handleMouseUp;
  
  return (
    <MainLayout>
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 70px)",
        }}
      >
  <Sidebar
  tool={tool}
  setTool={setTool}
  setClearCanvas={setClearCanvas}
  selectedColor={selectedColor}
  setSelectedColor={setSelectedColor}
   strokeWidth={strokeWidth}
  setStrokeWidth={setStrokeWidth}
/>

        <div
          style={{
            display: "flex",
            flex: 1,
          }}
        >
  <Whiteboard
  tool={tool}
  width={whiteboardWidth}
  clearCanvas={clearCanvas}
  selectedColor={selectedColor}
  strokeWidth={strokeWidth}

  showTextModal={showTextModal}
  setShowTextModal={setShowTextModal}

  textValue={textValue}
  setTextValue={setTextValue}

  textPosition={textPosition}
  setTextPosition={setTextPosition}

  pendingText={pendingText}
  setPendingText={setPendingText}
/>

<div
  className="divider"
  onMouseDown={handleMouseDown}
  style={{
    width: "5px",
    cursor: "col-resize",
    background: "#555",
  }}
></div>

<CodeEditor />
        </div>
      </div>

{showTextModal && (
  <div className="modal-overlay">
    <div className="join-modal">

      <button
        className="close-btn"
        onClick={() => {
          setShowTextModal(false);
          setTextValue("");
        }}
      >
        ×
      </button>

      <div className="modal-header">
        <div className="icon">📝</div>

        <div>
          <h2>Add Text</h2>
          <p>Enter the text you want to place on the canvas.</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Type something..."
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
      />

      <div className="modal-buttons">

        <button
          className="cancel-btn"
          onClick={() => {
            setShowTextModal(false);
            setTextValue("");
          }}
        >
          Cancel
        </button>

        <button
          onClick={() => {
  if (!textValue.trim()) return;

  setPendingText({
    x: textPosition.x,
    y: textPosition.y,
    text: textValue,
    color: selectedColor,
  });

  setShowTextModal(false);
  setTextValue("");
}}
        >
          Add Text
        </button>

      </div>
    </div>
  </div>
)}

    </MainLayout>
  );
}

export default Room;