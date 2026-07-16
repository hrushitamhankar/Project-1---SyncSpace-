import "./Whiteboard.css";
import { useState } from "react";
import { Stage, Layer, Line } from "react-konva";

function Whiteboard({ tool }) {
   const [lines, setLines] = useState([]);
   const [isDrawing, setIsDrawing] = useState(false);
   const handleMouseDown = (e) => {
  if (tool !== "pen") return;

  setIsDrawing(true);

  const pos = e.target.getStage().getPointerPosition();

  setLines([
    ...lines,
    {
      tool: "pen",
      points: [pos.x, pos.y],
    },
  ]);
};

const handleMouseMove = (e) => {
  if (!isDrawing || tool !== "pen") return;

  const stage = e.target.getStage();
  const point = stage.getPointerPosition();

  const lastLine = lines[lines.length - 1];

  lastLine.points = lastLine.points.concat([point.x, point.y]);

  lines.splice(lines.length - 1, 1, lastLine);

  setLines([...lines]);
};

const handleMouseUp = () => {
  setIsDrawing(false);
};

   return (
    <div className="whiteboard">
  <Stage
  width={600}
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
</Layer>
      </Stage>
    </div>
  );
}

export default Whiteboard;