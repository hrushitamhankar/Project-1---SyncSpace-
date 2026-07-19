import "./Whiteboard.css";
import { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";

function Whiteboard({
  tool,
  width,
  clearCanvas,
  selectedColor,
  strokeWidth,
}) {

  const [lines, setLines] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [texts, setTexts] = useState([]);

const [history, setHistory] = useState([]);
const [redoHistory, setRedoHistory] = useState([]);


  const [startPos, setStartPos] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

useEffect(() => {
  saveHistory();

  setLines([]);
  setRectangles([]);
  setCircles([]);
  setTexts([]);
}, [clearCanvas]);

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

  setCircles((prev) => [
    ...prev,
    {
      x: pos.x,
      y: pos.y,
      radius: 40,
      color: selectedColor,
      strokeWidth,
    },
  ]);
};

const addRectangle = (pos) => {
  saveHistory();

  setStartPos(pos);

  setRectangles((prev) => [
    ...prev,
    {
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      color: selectedColor,
      strokeWidth,
    },
  ]);
};

const addLine = (pos) => {
  setIsDrawing(true);

  setLines((prev) => [
    ...prev,
 {
  points: [pos.x, pos.y],
  color: selectedColor,
  strokeWidth,
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
  const value = prompt("Enter text");

  if (value) {
    saveHistory();
    setTexts((prev) => [
      ...prev,
      {
        x: pos.x,
        y: pos.y,
        text: value,
        color: selectedColor,
      },
    ]);
  }
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

    updated[updated.length - 1] = {
      ...lastLine,
      points: [...lastLine.points, point.x, point.y],
    };

    return updated;
  });
}

  // Rectangle drawing
  if (tool === "rectangle" && startPos) {
  setRectangles((prev) => {
    const updated = [...prev];

    updated[updated.length - 1] = {
      ...updated[updated.length - 1],
      width: point.x - startPos.x,
      height: point.y - startPos.y,
    };

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
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
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
stroke={rect.color}
strokeWidth={rect.strokeWidth}
  draggable
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
stroke={circle.color}
strokeWidth={circle.strokeWidth}
  draggable
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
    fill={text.color}
    draggable
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