import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const STARTER_CODE = `function greet(name) {
  console.log("Hello, " + name);
}

greet("Rakesh");
`;

const ROOM_NAME = "syncspace-code-room-v3";

function CodeEditor() {
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const documentRef = useRef(null);

  const [connectionStatus, setConnectionStatus] =
    useState("connecting");

  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(16);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
const [wordWrap, setWordWrap] = useState(false);
const [showMinimap, setShowMinimap] = useState(true);
const [tabSize, setTabSize] = useState(2);
  const handleEditorMount = (editor, monaco) => {
    // Prevent accidental double binding.
    if (bindingRef.current) {
      return;
    }

    const model = editor.getModel();

    if (!model) {
      console.error("Monaco model was not created.");
      return;
    }

    // Keep Monaco and Yjs line endings identical.
    model.setEOL(monaco.editor.EndOfLineSequence.LF);

    const yDocument = new Y.Doc();

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      ROOM_NAME,
      yDocument
    );

    const sharedText = yDocument.getText("code");

    provider.awareness.setLocalStateField("user", {
      name: `User-${Math.floor(Math.random() * 900 + 100)}`,
      color: `hsl(${Math.floor(Math.random() * 360)}, 75%, 55%)`,
    });

    provider.on("status", ({ status }) => {
      setConnectionStatus(status);
    });

    provider.on("sync", (isSynced) => {
      if (isSynced && sharedText.length === 0) {
        sharedText.insert(0, STARTER_CODE);
      }
    });

    const binding = new MonacoBinding(
      sharedText,
      model,
      new Set([editor]),
      provider.awareness
    );

    bindingRef.current = binding;
    providerRef.current = provider;
    documentRef.current = yDocument;
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      documentRef.current?.destroy();

      bindingRef.current = null;
      providerRef.current = null;
      documentRef.current = null;
    };
  }, []);

  return (
    <div className="code-editor-wrapper">
      <div className="editor-toolbar">
        {/* Language selector */}
        <div className="toolbar-control">
          <label htmlFor="language-select">Language:</label>

          <select
            id="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
        </div>

        {/* Theme selector */}
        <div className="toolbar-control">
          <label htmlFor="theme-select">Theme:</label>

          <select
            id="theme-select"
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
          >
            <option value="vs-dark">Dark</option>
            <option value="vs">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
        </div>

        {/* Font-size selector */}
        <div className="toolbar-control">
          <label htmlFor="font-size-select">Font:</label>

          <select
            id="font-size-select"
            value={fontSize}
            onChange={(event) =>
              setFontSize(Number(event.target.value))
            }
          >
            <option value={12}>12px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
            <option value={18}>18px</option>
            <option value={20}>20px</option>
            <option value={24}>24px</option>
          </select>
        </div>

        {/* Line-numbers selector */}
        <div className="toolbar-control">
          <label htmlFor="line-numbers-select">Lines:</label>

          <select
            id="line-numbers-select"
            value={showLineNumbers ? "show" : "hide"}
            onChange={(event) =>
              setShowLineNumbers(event.target.value === "show")
            }
          >
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </select>
        </div>
        

        {/* Yjs connection status */}
        <div className="toolbar-control">
  <label htmlFor="word-wrap-select">Wrap:</label>

  <select
    id="word-wrap-select"
    value={wordWrap ? "on" : "off"}
    onChange={(event) =>
      setWordWrap(event.target.value === "on")
    }
  >
    <option value="off">Off</option>
    <option value="on">On</option>
  </select>
</div>
<div className="toolbar-control">
  <label htmlFor="minimap-select">Minimap:</label>

  <select
    id="minimap-select"
    value={showMinimap ? "show" : "hide"}
    onChange={(event) =>
      setShowMinimap(event.target.value === "show")
    }
  >
    <option value="show">Show</option>
    <option value="hide">Hide</option>
  </select>
</div>
<div className="toolbar-control">
  <label htmlFor="tab-size-select">Tab:</label>

  <select
    id="tab-size-select"
    value={tabSize}
    onChange={(event) => setTabSize(Number(event.target.value))}
  >
    <option value={2}>2 spaces</option>
    <option value={4}>4 spaces</option>
    <option value={6}>6 spaces</option>
    <option value={8}>8 spaces</option>
  </select>
</div>
        <span className={`connection-status ${connectionStatus}`}>
          Yjs: {connectionStatus}
        </span>
      </div>

      <div className="editor-container">
        <Editor
          height="100%"
          path="file:///syncspace/main.js"
          language={language}
          defaultValue=""
          theme={theme}
          onMount={handleEditorMount}
         options={{
  fontSize,
  lineNumbers: showLineNumbers ? "on" : "off",
  wordWrap: wordWrap ? "on" : "off",
  automaticLayout: true,
 minimap: {
  enabled: showMinimap,
},
  scrollBeyondLastLine: false,
  tabSize,
  insertSpaces: true,
}}
        />
      </div>
    </div>
  );
}

export default CodeEditor;