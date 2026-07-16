import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
    const navigate = useNavigate();
  return (
   <header className="header">
      <h2>SyncSpace</h2>

      <div>
        <button onClick={() => navigate("/room")}>
            Join Room
        </button>
      </div>
    </header>
  );
}

export default Header;