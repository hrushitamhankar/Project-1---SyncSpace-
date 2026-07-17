import "./Whiteboard.css";
import { useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";

function Whiteboard({ tool, width, clearCanvas }) {
  const [lines, setLines] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [texts, setTexts] = useState([]);

  const [startPos, setStartPos] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

useEffect(() => {
  setLines([]);
  setRectangles([]);
  setCircles([]);
  setTexts([]);
}, [clearCanvas]);

const addCircle = (pos) => {
  setCircles((prev) => [
  ...prev,
  {
    x: pos.x,
    y: pos.y,
    radius: 40,
  },
]);
};

const addRectangle = (pos) => {
  setStartPos(pos);

  setRectangles((prev) => [
    ...prev,
    {
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
    },
  ]);
};

const addLine = (pos) => {
  setIsDrawing(true);

  setLines((prev) => [
    ...prev,
    {
      points: [pos.x, pos.y],
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
    setTexts((prev) => [
      ...prev,
      {
        x: pos.x,
        y: pos.y,
        text: value,
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
              stroke="black"
              strokeWidth={3}
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
  fill="skyblue"
  stroke="black"
  strokeWidth={2}
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
  fill="lightgreen"
  stroke="black"
  strokeWidth={2}
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