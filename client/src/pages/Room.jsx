import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import Sidebar from "../components/Sidebar/Sidebar";
import Whiteboard from "../components/Whiteboard/Whiteboard";
import CodeEditor from "../components/CodeEditor/CodeEditor";

function Room() {
  const [tool, setTool] = useState("pen");
  return (
    <MainLayout>
      <div
        style={{
          display: "flex",
          height: "calc(100vh - 70px)",
        }}
      >
       <Sidebar tool={tool} setTool={setTool} />

        <div
          style={{
            display: "flex",
            flex: 1,
          }}
        >
          <Whiteboard tool={tool} />
          <CodeEditor />
        </div>
      </div>
    </MainLayout>
  );
}

export default Room;