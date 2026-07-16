import "./Sidebar.css";

function Sidebar({ tool, setTool }) {
  return (
    <div className="sidebar">
      <h3>Tools</h3>

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
  onClick={() => setTool("clear")}
  style={{
    marginTop: "20px",
    width: "100%",
    padding: "10px",
  }}
>
  🗑 Clear Canvas
</button>
        </li>
    </ul>
    </div>
  );
}

export default Sidebar;