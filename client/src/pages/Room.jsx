import { useState, useRef, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import Sidebar from "../components/Sidebar/Sidebar";
import Whiteboard from "../components/Whiteboard/Whiteboard";
import CodeEditor from "../components/CodeEditor/CodeEditor";
import socket from "../services/socket";

function Room() {
    const [clearCanvas, setClearCanvas] = useState(false);
  const [tool, setTool] = useState("pen");
const [whiteboardWidth, setWhiteboardWidth] = useState(600);
const isDragging = useRef(false);

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
    </MainLayout>
  );
}

export default Room;