import "./Whiteboard.css";
import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";
import socket from "../../services/socket";
import { whiteboard } from "../../services/yjs";

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
  const activeLineId = useRef(null);

  const [lines, setLines] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [texts, setTexts] = useState([]);

  const roomId = localStorage.getItem("roomId");

useEffect(() => {
  const syncWhiteboardFromYjs = () => {
    const items = whiteboard.toArray();

    console.log("[YJS] Restoring whiteboard:", items);

    setLines(
  items.filter((item) => item.type === "line")
);

setRectangles(
  items.filter((item) => item.type === "rectangle")
);

setCircles(
  items.filter((item) => item.type === "circle")
);

setTexts(
  items.filter((item) => item.type === "text")
);
  };

  syncWhiteboardFromYjs();

  whiteboard.observe(syncWhiteboardFromYjs);

  return () => {
    whiteboard.unobserve(syncWhiteboardFromYjs);
  };
}, []);

const [history, setHistory] = useState([]);
const [redoHistory, setRedoHistory] = useState([]);


  const [startPos, setStartPos] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [selectedShape, setSelectedShape] = useState(null);

const deleteShapeFromYjs = (type, index) => {
  const items = whiteboard.toArray();

  let shapeIndex = -1;
  let matchingIndex = 0;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type === type) {
      if (matchingIndex === index) {
        shapeIndex = i;
        break;
      }

      matchingIndex++;
    }
  }

  if (shapeIndex !== -1) {
    whiteboard.delete(shapeIndex, 1);
  }
};

useEffect(() => {
  saveHistory();

  setLines([]);
  setRectangles([]);
  setCircles([]);
  setTexts([]);
}, [clearCanvas]);

useEffect(() => {
  if (!pendingText) return;

  const text = {
    id: crypto.randomUUID(),
    ...pendingText,
  };

  whiteboard.push([
    {
      type: "text",
      ...text,
    },
  ]);

  setPendingText(null);
}, [pendingText, setPendingText]);


useEffect(() => {
  const handleKeyDown = (e) => {
   if (e.key !== "Delete" || !selectedShape) return;

deleteShapeFromYjs(
  selectedShape.type,
  selectedShape.index
);

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
  id: crypto.randomUUID(),
  x: pos.x,
  y: pos.y,
  radius: 40,
  color: selectedColor,
  strokeWidth,
};

  setCircles((prev) => [...prev, circle]);

whiteboard.push([
  {
    type: "circle",
    ...circle,
  },
]);

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
  id: crypto.randomUUID(),
  x: pos.x,
  y: pos.y,
  width: 0,
  height: 0,
  color: selectedColor,
  strokeWidth,
};


whiteboard.push([
  {
    type: "rectangle",
    ...rectangle,
  },
]);

};

const addLine = (pos) => {
  setIsDrawing(true);

  const line = {
    id: crypto.randomUUID(),
    points: [pos.x, pos.y],
    color: selectedColor,
    strokeWidth,
  };

  activeLineId.current = line.id;

  whiteboard.push([
    {
      type: "line",
      ...line,
    },
  ]);
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
 if (tool === "pen" && isDrawing && activeLineId.current) {
  const items = whiteboard.toArray();

  const lineIndex = items.findIndex(
    (item) => item.id === activeLineId.current
  );

  if (lineIndex === -1) return;

  const currentLine = items[lineIndex];

  const updatedLine = {
    ...currentLine,
    points: [...currentLine.points, point.x, point.y],
  };

  whiteboard.delete(lineIndex, 1);

  whiteboard.insert(lineIndex, [
    {
      type: "line",
      ...updatedLine,
    },
  ]);
}

  // Rectangle drawing
  if (tool === "rectangle" && startPos) {
  const items = whiteboard.toArray();

  const rectanglesInYjs = items.filter(
    (item) => item.type === "rectangle"
  );

  const currentRectangle =
    rectanglesInYjs[rectanglesInYjs.length - 1];

  if (!currentRectangle) return;

  const updatedRectangle = {
    ...currentRectangle,
    width: point.x - startPos.x,
    height: point.y - startPos.y,
  };

  const yIndex = items.findIndex(
    (item) => item.id === currentRectangle.id
  );

  if (yIndex !== -1) {
    whiteboard.delete(yIndex, 1);

    whiteboard.insert(yIndex, [
      {
        type: "rectangle",
        ...updatedRectangle,
      },
    ]);
  }
}
};

const handleMouseUp = () => {
  setIsDrawing(false);
  setStartPos(null);
  activeLineId.current = null;
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
  deleteShapeFromYjs("line", index);
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
  deleteShapeFromYjs("rectangle", index);
  return;
}

  setSelectedShape({
    type: "rectangle",
    index,
  });
}}
onDragEnd={(e) => {
  const updated = [...rectangles];

  const updatedRectangle = {
    ...updated[index],
    x: e.target.x(),
    y: e.target.y(),
  };

  updated[index] = updatedRectangle;
  setRectangles(updated);

  const items = whiteboard.toArray();

  const yIndex = items.findIndex(
    (item) => item.id === updatedRectangle.id
  );

  if (yIndex !== -1) {
    whiteboard.delete(yIndex, 1);

    whiteboard.insert(yIndex, [
      {
        type: "rectangle",
        ...updatedRectangle,
      },
    ]);
  }
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
  deleteShapeFromYjs("circle", index);
  return;
}

  setSelectedShape({
    type: "circle",
    index,
  });
}}
onDragEnd={(e) => {
  const updated = [...circles];

  const updatedCircle = {
    ...updated[index],
    x: e.target.x(),
    y: e.target.y(),
  };

  updated[index] = updatedCircle;
  setCircles(updated);

  const items = whiteboard.toArray();

  const yIndex = items.findIndex(
    (item) => item.id === updatedCircle.id
  );

  if (yIndex !== -1) {
    whiteboard.delete(yIndex, 1);

    whiteboard.insert(yIndex, [
      {
        type: "circle",
        ...updatedCircle,
      },
    ]);
  }
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
  deleteShapeFromYjs("text", index);
  return;
}

  setSelectedShape({
    type: "text",
    index,
  });
}}
onDragEnd={(e) => {
  const updated = [...texts];

  const updatedText = {
    ...updated[index],
    x: e.target.x(),
    y: e.target.y(),
  };

  updated[index] = updatedText;
  setTexts(updated);

  const items = whiteboard.toArray();

  const yIndex = items.findIndex(
    (item) => item.id === updatedText.id
  );

  if (yIndex !== -1) {
    whiteboard.delete(yIndex, 1);

    whiteboard.insert(yIndex, [
      {
        type: "text",
        ...updatedText,
      },
    ]);
  }
}}
  />
))}
        </Layer>
      </Stage>
    </div>
  );
}

export default Whiteboard;