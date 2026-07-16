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

// New room name prevents old broken document data from loading.
const ROOM_NAME = "syncspace-code-room-v3";

function CodeEditor() {
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const documentRef = useRef(null);

  const [connectionStatus, setConnectionStatus] =
    useState("connecting");

  const [language, setLanguage] = useState("javascript");

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

    // Force Monaco and Yjs to use the same line-ending format.
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

    // Add starter code after the initial server sync.
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
      <div className={`connection-status ${connectionStatus}`}>
        Yjs: {connectionStatus}
      </div>

      <div className="editor-toolbar">
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

      <Editor
        height="100%"
        path="file:///syncspace/main.js"
        language={language}
        defaultValue=""
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          fontSize: 16,
          automaticLayout: true,
          minimap: {
            enabled: true,
          },
          wordWrap: "off",
          scrollBeyondLastLine: false,
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    </div>
  );
}

export default CodeEditor;