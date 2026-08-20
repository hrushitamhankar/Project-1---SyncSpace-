import CodeEditor from "./editor/CodeEditor.jsx";
import Whiteboard from "./Whiteboard.jsx";
import "./App.css";

function App() {

    return (
        <main className="syncspace-app">

            <header className="app-header">

                <div className="brand-mark">
                    S
                </div>

                <div>
                    <h1>
                        SyncSpace
                    </h1>

                    <p>
                        Real-Time Collaborative
                        Workspace
                    </p>
                </div>

                <div className="live-badge">
                    <span />
                    LIVE COLLABORATION
                </div>

            </header>

            <section className="workspace">

                <div className="whiteboard-pane">

                    <Whiteboard />

                </div>

                <div className="editor-pane">

                    <CodeEditor />

                </div>

            </section>

        </main>
    );
}

export default App;