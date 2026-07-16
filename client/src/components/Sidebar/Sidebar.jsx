function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        background: "#2d2d2d",
        color: "white",
        padding: "20px",
        height: "calc(100vh - 70px)",
      }}
    >
      <h3>Tools</h3>

      <ul style={{ listStyle: "none", padding: 0 }}>
        <li>✏ Pen</li>
        <li>⬜ Rectangle</li>
        <li>⭕ Circle</li>
        <li>📝 Text</li>
      </ul>
    </aside>
  );
}

export default Sidebar;