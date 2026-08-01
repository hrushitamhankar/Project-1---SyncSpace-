import "./Sidebar.css";

function Sidebar({
  tool,
  setTool,
  setClearCanvas,
  selectedColor,
  setSelectedColor,
  strokeWidth,
  setStrokeWidth,
}) {
  
  return (
    <div className="sidebar">
      <h3>Tools</h3>

<div style={{ marginBottom: "15px" }}>
  <label style={{ display: "block", marginBottom: "5px" }}>
    Color
  </label>

  <input
    type="color"
    value={selectedColor}
    onChange={(e) => setSelectedColor(e.target.value)}
    style={{
      width: "100%",
      height: "40px",
      border: "none",
      cursor: "pointer",
    }}
  />
</div>

<div style={{ marginBottom: "15px" }}>
  <label style={{ display: "block", marginBottom: "5px" }}>
    Stroke Width
  </label>

  <select
    value={strokeWidth}
    onChange={(e) => setStrokeWidth(Number(e.target.value))}
    style={{
      width: "100%",
      padding: "8px",
    }}
  >
    <option value={2}>Thin</option>
    <option value={5}>Medium</option>
    <option value={8}>Thick</option>
  </select>
</div>

      <ul>
         <li onClick={() => setTool("pen")}>
             ✏ Pen {tool === "pen" && "✅"}
        </li>

        <li onClick={() => setTool("rectangle")}>
             ⬜ Rectangle {tool === "rectangle" && "✅"}
        </li>

        <li onClick={() => setTool("circle")}>
            ⭕ Circle {tool === "circle" && "✅"}
        </li>

        <li onClick={() => setTool("text")}>
            📝 Text {tool === "text" && "✅"}
        </li>
        <li>
            <button
  onClick={() => setClearCanvas((prev) => !prev)}
  style={{
    marginTop: "20px",
    width: "100%",
    padding: "10px",
  }}
>
  🗑 Clear Canvas
</button>
        </li>
        <li>
          <button onClick={() => setTool("eraser")}>
  Eraser
</button>
        </li>
    </ul>
    </div>
  );
}

export default Sidebar;