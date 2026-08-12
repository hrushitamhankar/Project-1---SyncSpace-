import "./Whiteboard.css";
import { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";
import socket from "../../services/socket";

function Whiteboard({
  tool,
  width,
  clearCanvas,
  selectedColor,
  strokeWidth,

  showTextModal,
  setShowTextModal,

  textValue,
  setTextValue,

  textPosition,
  setTextPosition,

  pendingText,
  setPendingText,
}){

  const [lines, setLines] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [texts, setTexts] = useState([]);

  const roomId = localStorage.getItem("roomId");

const [history, setHistory] = useState([]);
const [redoHistory, setRedoHistory] = useState([]);


  const [startPos, setStartPos] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [selectedShape, setSelectedShape] = useState(null);

useEffect(() => {
  saveHistory();

  setLines([]);
  setRectangles([]);
  setCircles([]);
  setTexts([]);
}, [clearCanvas]);

useEffect(() => {
  if (!pendingText) return;

  setTexts((prev) => [...prev, pendingText]);

  socket.emit("whiteboard-draw", {
    roomId,
    action: "text",
    text: pendingText,
  });

  setPendingText(null);
}, [pendingText, setPendingText, roomId]);

useEffect(() => {
  const handleWhiteboardDraw = (data) => {
  if (!data || data.roomId !== roomId) return;

  console.log("[WHITEBOARD RECEIVED]", data.action, data);

  if (data.action === "line") {
    setLines((prev) => [...prev, data.line]);
  }

  if (data.action === "line-update") {
    setLines((prev) => {
      if (prev.length === 0) return prev;

      const updated = [...prev];
      updated[updated.length - 1] = data.line;

      return updated;
    });
  }

   if (data.action === "rectangle") {
  setRectangles((prev) => [...prev, data.rectangle]);
}

if (data.action === "rectangle-update") {
  setRectangles((prev) => {
    if (prev.length === 0) return prev;

    const updated = [...prev];
    updated[updated.length - 1] = data.rectangle;

    return updated;
  });
}

  if (data.action === "circle") {
    setCircles((prev) => [...prev, data.circle]);
  }

  if (data.action === "text") {
    setTexts((prev) => [...prev, data.text]);
  }
};
  socket.on("whiteboard-draw", handleWhiteboardDraw);

  return () => {
    socket.off("whiteboard-draw", handleWhiteboardDraw);
  };
}, [roomId]);

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key !== "Delete" || !selectedShape) return;

    switch (selectedShape.type) {
      case "rectangle":
        setRectangles((prev) =>
          prev.filter((_, i) => i !== selectedShape.index)
        );
        break;

case "circle":
  setCircles((prev) =>
    prev.filter((_, i) => i !== selectedShape.index)
  );
  break;

case "text":
  setTexts((prev) =>
    prev.filter((_, i) => i !== selectedShape.index)
  );
  break;

case "line":
  setLines((prev) =>
    prev.filter((_, i) => i !== selectedShape.index)
  );
  break;

      default:
        break;
    }

    setSelectedShape(null);
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedShape]);

const saveHistory = () => {
  setHistory((prev) => [
    ...prev,
    {
      lines: [...lines],
      rectangles: [...rectangles],
      circles: [...circles],
      texts: [...texts],
    },
  ]);

  setRedoHistory([]);
};


const undo = () => {
  if (history.length === 0) return;

  const previous = history[history.length - 1];

  setRedoHistory((prev) => [
    ...prev,
    {
      lines,
      rectangles,
      circles,
      texts,
    },
  ]);

  setLines(previous.lines);
  setRectangles(previous.rectangles);
  setCircles(previous.circles);
  setTexts(previous.texts);

  setHistory((prev) => prev.slice(0, -1));
};

const addCircle = (pos) => {
  saveHistory();

  const circle = {
    x: pos.x,
    y: pos.y,
    radius: 40,
    color: selectedColor,
    strokeWidth,
  };

  setCircles((prev) => [...prev, circle]);

  socket.emit("whiteboard-draw", {
    roomId,
    action: "circle",
    circle,
  });
};

const addRectangle = (pos) => {
  saveHistory();

  setStartPos(pos);

  const rectangle = {
    x: pos.x,
    y: pos.y,
    width: 0,
    height: 0,
    color: selectedColor,
    strokeWidth,
  };

  setRectangles((prev) => [...prev, rectangle]);

  socket.emit("whiteboard-draw", {
    roomId,
    action: "rectangle",
    rectangle,
  });
};

const addLine = (pos) => {
  setIsDrawing(true);

  const line = {
    points: [pos.x, pos.y],
    color: selectedColor,
    strokeWidth,
  };

  setLines((prev) => [...prev, line]);

  socket.emit("whiteboard-draw", {
    roomId,
    action: "line",
    line,
  });
};

  const handleMouseDown = (e) => {
    if (e.target !== e.target.getStage()) {
    return;
  }

    const pos = e.target.getStage().getPointerPosition();


if (tool === "pen") {
  addLine(pos);
}

if (tool === "rectangle") {
  addRectangle(pos);
}
  
if (tool === "circle") {
  addCircle(pos);
}

if (tool === "text") {
  setTextPosition(pos);
  setShowTextModal(true);
  return;
}

};

const handleMouseMove = (e) => {
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();

  // Pen drawing
 if (tool === "pen" && isDrawing) {
  setLines((prev) => {
    const updated = [...prev];

    const lastLine = updated[updated.length - 1];

    const updatedLine = {
      ...lastLine,
      points: [...lastLine.points, point.x, point.y],
    };

    updated[updated.length - 1] = updatedLine;

    socket.emit("whiteboard-draw", {
      roomId,
      action: "line-update",
      line: updatedLine,
    });

    return updated;
  });
}

  // Rectangle drawing
  if (tool === "rectangle" && startPos) {
  setRectangles((prev) => {
    const updated = [...prev];

    const updatedRectangle = {
      ...updated[updated.length - 1],
      width: point.x - startPos.x,
      height: point.y - startPos.y,
    };

    updated[updated.length - 1] = updatedRectangle;

    socket.emit("whiteboard-draw", {
      roomId,
      action: "rectangle-update",
      rectangle: updatedRectangle,
    });

    return updated;
  });
}
};

const handleMouseUp = () => {
  setIsDrawing(false);
  setStartPos(null);
};

  return (
    <div className="whiteboard">
      <Stage
        width={width}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {lines.map((line, index) => (
            <Line
              key={index}
              points={line.points}
stroke={
  selectedShape?.type === "line" &&
  selectedShape?.index === index
    ? "dodgerblue"
    : line.color
}

strokeWidth={
  selectedShape?.type === "line" &&
  selectedShape?.index === index
    ? line.strokeWidth + 2
    : line.strokeWidth
}
              tension={0.5}
              lineCap="round"
              lineJoin="round"

  onClick={() => {
  if (tool === "eraser") {
    setLines((prev) => prev.filter((_, i) => i !== index));
    return;
  }

  setSelectedShape({
    type: "line",
    index,
  });
}}

            />
          ))}

{rectangles.map((rect, index) => (
<Rect
  key={index}
  x={rect.x}
  y={rect.y}
  width={rect.width}
  height={rect.height}
fill="transparent"
stroke={
  selectedShape?.type === "rectangle" &&
  selectedShape?.index === index
    ? "dodgerblue"
    : rect.color
}
strokeWidth={
  selectedShape?.type === "rectangle" &&
  selectedShape?.index === index
    ? rect.strokeWidth + 2
    : rect.strokeWidth
}
  draggable
  onClick={() => {
  if (tool === "eraser") {
    setRectangles((prev) => prev.filter((_, i) => i !== index));
    return;
  }

  setSelectedShape({
    type: "rectangle",
    index,
  });
}}
  onDragEnd={(e) => {
    const updated = [...rectangles];

    updated[index] = {
      ...updated[index],
      x: e.target.x(),
      y: e.target.y(),
    };

    setRectangles(updated);
  }}
/>
 ))}

{circles.map((circle, index) => (
  <Circle
  key={index}
  x={circle.x}
  y={circle.y}
  radius={circle.radius}
fill="transparent"
stroke={
  selectedShape?.type === "circle" &&
  selectedShape?.index === index
    ? "dodgerblue"
    : circle.color
}

strokeWidth={
  selectedShape?.type === "circle" &&
  selectedShape?.index === index
    ? circle.strokeWidth + 2
    : circle.strokeWidth
}
  draggable
  onClick={() => {
  if (tool === "eraser") {
    setCircles((prev) => prev.filter((_, i) => i !== index));
    return;
  }

  setSelectedShape({
    type: "circle",
    index,
  });
}}
  onDragEnd={(e) => {
    const updated = [...circles];

    updated[index] = {
      ...updated[index],
      x: e.target.x(),
      y: e.target.y(),
    };

    setCircles(updated);
  }}
/>
))}

{texts.map((text, index) => (
  <Text
    key={index}
    x={text.x}
    y={text.y}
    text={text.text}
    fontSize={20}
    fill={
  selectedShape?.type === "text" &&
  selectedShape?.index === index
    ? "dodgerblue"
    : text.color
}
    draggable
  onClick={() => {
  if (tool === "eraser") {
    setTexts((prev) => prev.filter((_, i) => i !== index));
    return;
  }

  setSelectedShape({
    type: "text",
    index,
  });
}}
    onDragEnd={(e) => {
      const updated = [...texts];

      updated[index] = {
        ...updated[index],
        x: e.target.x(),
        y: e.target.y(),
      };

      setTexts(updated);
    }}
  />
))}
        </Layer>
      </Stage>
    </div>
  );
}

export default Whiteboard;