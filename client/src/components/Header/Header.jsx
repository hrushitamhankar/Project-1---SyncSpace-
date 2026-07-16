function Header() {
  return (
    <header
      style={{
        backgroundColor: "#24292e",
        color: "white",
        padding: "15px 30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2>SyncSpace</h2>

      <div>
        <button>Join Room</button>
      </div>
    </header>
  );
}

export default Header;