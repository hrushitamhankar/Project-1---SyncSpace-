import CodeEditor from "./editor/CodeEditor.jsx";
import "./App.css";

function App() {
  return (
    <main className="syncspace-app">
      <header className="app-header">
        <h1>SyncSpace</h1>
        <p>Real-Time Collaborative Whiteboard & Code Editor</p>
      </header>

      <section className="workspace">
        <div className="whiteboard-pane">
          <h2>Whiteboard</h2>
          <p>F1's collaborative whiteboard will be integrated here.</p>
        </div>

        <div className="editor-pane">
          <CodeEditor />
        </div>
      </section>
    </main>
  );
}

export default App;