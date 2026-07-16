import "./Whiteboard.css";
import { useState } from "react";
import { Stage, Layer, Line, Rect, Circle, Text } from "react-konva";

function Whiteboard({ tool, width }) {
  const [lines, setLines] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [texts, setTexts] = useState([]);

  const [startPos, setStartPos] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

const addText = (pos) => {
  setTexts([
    ...texts,
    {
      x: pos.x,
      y: pos.y,
      text: "Double Click",
    },
  ]);
};

const addCircle = (pos) => {
  setCircles([
    ...circles,
    {
      x: pos.x,
      y: pos.y,
      radius: 40,
    },
  ]);
};

const addRectangle = (pos) => {
  setStartPos(pos);

  setRectangles([
    ...rectangles,
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

  setLines([
    ...lines,
    {
      points: [pos.x, pos.y],
    },
  ]);
};

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();

if (tool === "clear") {
  setLines([]);
  setRectangles([]);
  setCircles([]);
  setTexts([]);
  return;
}

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
  addText(pos);
}

};

const handleMouseMove = (e) => {
  const stage = e.target.getStage();
  const point = stage.getPointerPosition();

  // Pen drawing
  if (tool === "pen" && isDrawing) {
    const lastLine = lines[lines.length - 1];

    lastLine.points = lastLine.points.concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);

    setLines([...lines]);
  }

  // Rectangle drawing
  if (tool === "rectangle" && startPos) {
    const lastRect = rectangles[rectangles.length - 1];

    lastRect.width = point.x - startPos.x;
    lastRect.height = point.y - startPos.y;

    rectangles.splice(rectangles.length - 1, 1, lastRect);

    setRectangles([...rectangles]);
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
  />
))}

{texts.map((item, index) => (
  <Text
    key={index}
    x={item.x}
    y={item.y}
    text={item.text}
    fontSize={20}
    fill="black"
  />
))}
        </Layer>
      </Stage>
    </div>
  );
}

export default Whiteboard;