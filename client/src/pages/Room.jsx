import Header from "../components/Header/Header";
import Sidebar from "../components/Sidebar/Sidebar";
import Whiteboard from "../components/Whiteboard/Whiteboard";
import CodeEditor from "../components/CodeEditor/CodeEditor";

function Room() {
  return (
    <>
      <Header />

      <div
        style={{
          display: "flex",
          height: "calc(100vh - 70px)",
        }}
      >
        <Sidebar />

        <div
          style={{
            display: "flex",
            flex: 1,
          }}
        >
          <Whiteboard />
          <CodeEditor />
        </div>
      </div>
    </>
  );
}

export default Room;