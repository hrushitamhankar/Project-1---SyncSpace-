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

const DEFAULT_ROOM_NAME = "syncspace-code-room-v3";

const getRoomName = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const roomName = searchParams.get("room");

  return roomName?.trim() || DEFAULT_ROOM_NAME;
};

const sanitizeFileName = (name) => {
  const cleanedName = name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_");

  return cleanedName || "main.js";
};

const ROOM_NAME = getRoomName();

function CodeEditor() {
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const documentRef = useRef(null);
  const editorRef = useRef(null);
  const awarenessChangeHandlerRef = useRef(null);
  const editorDisposablesRef = useRef([]);

  const copyTimerRef = useRef(null);
  const shareTimerRef = useRef(null);
  const downloadTimerRef = useRef(null);

  const [connectionStatus, setConnectionStatus] =
    useState("connecting");

  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(16);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [tabSize, setTabSize] = useState(2);
  const [readOnly, setReadOnly] = useState(false);
  const [fileName, setFileName] = useState("main.js");

  const [activeUsers, setActiveUsers] = useState(0);
  const [activeUserDetails, setActiveUserDetails] = useState([]);

  const [copyFeedback, setCopyFeedback] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const [downloadFeedback, setDownloadFeedback] = useState("");

  const [cursorPosition, setCursorPosition] = useState({
    lineNumber: 1,
    column: 1,
  });

  const [documentStats, setDocumentStats] = useState({
    lineCount: 1,
    characterCount: 0,
  });

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    if (bindingRef.current) {
      return;
    }

    const model = editor.getModel();

    if (!model) {
      console.error("Monaco model was not created.");
      return;
    }

    model.setEOL(monaco.editor.EndOfLineSequence.LF);

    const updateDocumentStats = () => {
      setDocumentStats({
        lineCount: model.getLineCount(),
        characterCount: model.getValueLength(),
      });
    };

    const contentDisposable =
      model.onDidChangeContent(updateDocumentStats);

    const cursorDisposable =
      editor.onDidChangeCursorPosition((event) => {
        setCursorPosition({
          lineNumber: event.position.lineNumber,
          column: event.position.column,
        });
      });

    editorDisposablesRef.current = [
      contentDisposable,
      cursorDisposable,
    ];

    updateDocumentStats();

    const initialPosition = editor.getPosition();

    if (initialPosition) {
      setCursorPosition({
        lineNumber: initialPosition.lineNumber,
        column: initialPosition.column,
      });
    }

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

    const updateActiveUsers = () => {
      const users = Array.from(
        provider.awareness.getStates().entries()
      ).map(([clientId, state]) => ({
        clientId,
        name: state.user?.name || `User-${clientId}`,
        color: state.user?.color || "#94a3b8",
      }));

      setActiveUsers(users.length);
      setActiveUserDetails(users);
    };

    awarenessChangeHandlerRef.current = updateActiveUsers;

    provider.awareness.on("change", updateActiveUsers);
    updateActiveUsers();

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

  const handleResetEditor = () => {
    if (readOnly) {
      return;
    }

    const yDocument = documentRef.current;

    if (!yDocument) {
      return;
    }

    const sharedText = yDocument.getText("code");

    yDocument.transact(() => {
      sharedText.delete(0, sharedText.length);
      sharedText.insert(0, STARTER_CODE);
    });
  };

  const handleCopyCode = async () => {
    const editor = editorRef.current;

    if (!editor) {
      setCopyFeedback("Copy failed");
      return;
    }

    try {
      await navigator.clipboard.writeText(editor.getValue());
      setCopyFeedback("Copied!");
    } catch (error) {
      console.error("Unable to copy editor code:", error);
      setCopyFeedback("Copy failed");
    }

    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }

    copyTimerRef.current = window.setTimeout(() => {
      setCopyFeedback("");
    }, 2000);
  };

  const handleDownloadCode = () => {
    const editor = editorRef.current;

    if (!editor) {
      setDownloadFeedback("Failed");
      return;
    }

    try {
      const code = editor.getValue();
      const safeFileName = sanitizeFileName(fileName);

      const fileBlob = new Blob([code], {
        type: "text/plain;charset=utf-8",
      });

      const downloadUrl = URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = safeFileName;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, 0);

      setDownloadFeedback("Downloaded!");
    } catch (error) {
      console.error("Unable to download editor code:", error);
      setDownloadFeedback("Failed");
    }

    if (downloadTimerRef.current) {
      window.clearTimeout(downloadTimerRef.current);
    }

    downloadTimerRef.current = window.setTimeout(() => {
      setDownloadFeedback("");
    }, 2000);
  };

  const handleShareRoom = async () => {
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("room", ROOM_NAME);

    try {
      await navigator.clipboard.writeText(shareUrl.toString());
      setShareFeedback("Link copied!");
    } catch (error) {
      console.error("Unable to copy room link:", error);
      setShareFeedback("Copy failed");
    }

    if (shareTimerRef.current) {
      window.clearTimeout(shareTimerRef.current);
    }

    shareTimerRef.current = window.setTimeout(() => {
      setShareFeedback("");
    }, 2000);
  };

  useEffect(() => {
    return () => {
      const provider = providerRef.current;
      const awarenessHandler =
        awarenessChangeHandlerRef.current;

      if (provider && awarenessHandler) {
        provider.awareness.off("change", awarenessHandler);
      }

      editorDisposablesRef.current.forEach((disposable) => {
        disposable.dispose();
      });

      editorDisposablesRef.current = [];

      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }

      if (shareTimerRef.current) {
        window.clearTimeout(shareTimerRef.current);
      }

      if (downloadTimerRef.current) {
        window.clearTimeout(downloadTimerRef.current);
      }

      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      documentRef.current?.destroy();

      bindingRef.current = null;
      providerRef.current = null;
      documentRef.current = null;
      editorRef.current = null;
      awarenessChangeHandlerRef.current = null;

      copyTimerRef.current = null;
      shareTimerRef.current = null;
      downloadTimerRef.current = null;
    };
  }, []);

  return (
    <div className="code-editor-wrapper">
      <div className="editor-toolbar">
        <div className="toolbar-control">
          <label htmlFor="language-select">Language:</label>

          <select
            id="language-select"
            value={language}
            onChange={(event) =>
              setLanguage(event.target.value)
            }
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

        <div className="toolbar-control">
          <label htmlFor="line-numbers-select">Lines:</label>

          <select
            id="line-numbers-select"
            value={showLineNumbers ? "show" : "hide"}
            onChange={(event) =>
              setShowLineNumbers(
                event.target.value === "show"
              )
            }
          >
            <option value="show">Show</option>
            <option value="hide">Hide</option>
          </select>
        </div>

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
              setShowMinimap(
                event.target.value === "show"
              )
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
            onChange={(event) =>
              setTabSize(Number(event.target.value))
            }
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={6}>6 spaces</option>
            <option value={8}>8 spaces</option>
          </select>
        </div>

        <div className="toolbar-control">
          <label htmlFor="read-only-select">Mode:</label>

          <select
            id="read-only-select"
            value={readOnly ? "readonly" : "editable"}
            onChange={(event) =>
              setReadOnly(
                event.target.value === "readonly"
              )
            }
          >
            <option value="editable">Editable</option>
            <option value="readonly">Read Only</option>
          </select>
        </div>

        <div className="toolbar-control">
          <label htmlFor="file-name-input">File:</label>

          <input
            id="file-name-input"
            type="text"
            value={fileName}
            onChange={(event) =>
              setFileName(event.target.value)
            }
            placeholder="main.js"
          />
        </div>

        <button
          type="button"
          className="copy-code-button"
          onClick={handleCopyCode}
        >
          {copyFeedback || "Copy"}
        </button>

        <button
          type="button"
          className="copy-code-button download-code-button"
          onClick={handleDownloadCode}
        >
          {downloadFeedback || "Download"}
        </button>

        <button
          type="button"
          className="reset-editor-button"
          onClick={handleResetEditor}
          disabled={readOnly}
        >
          Reset
        </button>

        <button
          type="button"
          className="copy-code-button share-room-button"
          onClick={handleShareRoom}
        >
          {shareFeedback || "Share Room"}
        </button>

        <span className="active-users-count">
          Users: {activeUsers}
        </span>

        <div
          className="active-user-presence"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {activeUserDetails.map((user) => (
            <span
              key={user.clientId}
              title={`${user.name} is active`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 8px",
                border: "1px solid #4b5563",
                borderRadius: "999px",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "9px",
                  height: "9px",
                  borderRadius: "50%",
                  backgroundColor: user.color,
                  flexShrink: 0,
                }}
              />

              {user.name}
            </span>
          ))}
        </div>

        <span
          className={`connection-status ${connectionStatus}`}
        >
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
            readOnly,
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

      <div
        className="editor-status-bar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          minHeight: "30px",
          padding: "5px 12px",
          background: "#18181b",
          borderTop: "1px solid #3f3f46",
          color: "#d4d4d8",
          fontSize: "12px",
          whiteSpace: "nowrap",
          overflowX: "auto",
        }}
      >
        <span>{fileName.trim() || "Untitled"}</span>

        <span>
          Ln {cursorPosition.lineNumber}, Col{" "}
          {cursorPosition.column}
        </span>

        <span>Lines: {documentStats.lineCount}</span>

        <span>
          Characters: {documentStats.characterCount}
        </span>

        <span>Room: {ROOM_NAME}</span>
      </div>
    </div>
  );
}

export default CodeEditor;