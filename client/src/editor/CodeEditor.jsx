import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { io } from "socket.io-client";
import "./CodeEditor.css";

const SOCKET_URL = "http://localhost:5000";

const ROOM_ID = "syncspace-code-room-v4";

const INITIAL_CODE = `function greet(name) {
    console.log("Hello, " + name);
}

greet("Devasya");`;

function CodeEditor() {
    const [code, setCode] =
        useState(INITIAL_CODE);

    const [connected, setConnected] =
        useState(false);

    const [activeUsers, setActiveUsers] =
        useState(0);

    const ydocRef =
        useRef(null);

    const ytextRef =
        useRef(null);

    const socketRef =
        useRef(null);

    const remoteUpdateRef =
        useRef(false);

    useEffect(() => {
        // -----------------------------
        // YJS DOCUMENT
        // -----------------------------

        const ydoc =
            new Y.Doc();

        const ytext =
            ydoc.getText("code");

        ydocRef.current = ydoc;
        ytextRef.current = ytext;

        // -----------------------------
        // SOCKET
        // -----------------------------

        const socket =
            io(SOCKET_URL, {
                transports: [
                    "websocket",
                    "polling",
                ],

                reconnection: true,
            });

        socketRef.current =
            socket;

        // -----------------------------
        // CONNECT
        // -----------------------------

        socket.on(
            "connect",
            () => {
                console.log(
                    "[SYNCSPACE] Connected:",
                    socket.id
                );

                setConnected(true);

                socket.emit(
                    "join-room",
                    {
                        roomId:
                            ROOM_ID,
                    }
                );
            }
        );

        // -----------------------------
        // DISCONNECT
        // -----------------------------

        socket.on(
            "disconnect",
            () => {
                console.log(
                    "[SYNCSPACE] Disconnected"
                );

                setConnected(false);
                setActiveUsers(0);
            }
        );

        // -----------------------------
        // CONNECTION ERROR
        // -----------------------------

        socket.on(
            "connect_error",
            (error) => {
                console.error(
                    "[SYNCSPACE] Connection error:",
                    error.message
                );

                setConnected(false);
            }
        );

        // -----------------------------
        // USER COUNT
        // -----------------------------

        socket.on(
            "room-users",
            (count) => {
                setActiveUsers(
                    Number(count) || 0
                );
            }
        );

        // -----------------------------
        // INITIAL YJS STATE
        // -----------------------------

        socket.on(
            "yjs-state",
            (data) => {
                try {
                    if (!data) {
                        return;
                    }

                    const rawUpdate =
                        data.update;

                    if (!rawUpdate) {
                        return;
                    }

                    const update =
                        rawUpdate instanceof
                            Uint8Array
                            ? rawUpdate
                            : new Uint8Array(
                                rawUpdate
                            );

                    remoteUpdateRef.current =
                        true;

                    Y.applyUpdate(
                        ydoc,
                        update,
                        "remote"
                    );

                    remoteUpdateRef.current =
                        false;

                    const current =
                        ytext.toString();

                    // Only use server state
                    // if it contains content.
                    if (current.length > 0) {
                        setCode(current);
                    }

                    // If server document is
                    // empty, create initial code.
                    if (
                        current.length === 0
                    ) {
                        ytext.insert(
                            0,
                            INITIAL_CODE
                        );

                        setCode(
                            INITIAL_CODE
                        );
                    }

                } catch (error) {
                    console.error(
                        "[YJS] State error:",
                        error
                    );

                    remoteUpdateRef.current =
                        false;
                }
            }
        );

        // -----------------------------
        // REMOTE YJS UPDATE
        // -----------------------------

        socket.on(
            "yjs-update",
            (data) => {
                try {
                    if (!data) {
                        return;
                    }

                    const rawUpdate =
                        data.update;

                    if (!rawUpdate) {
                        return;
                    }

                    const update =
                        rawUpdate instanceof
                            Uint8Array
                            ? rawUpdate
                            : new Uint8Array(
                                rawUpdate
                            );

                    remoteUpdateRef.current =
                        true;

                    Y.applyUpdate(
                        ydoc,
                        update,
                        "remote"
                    );

                    remoteUpdateRef.current =
                        false;

                    setCode(
                        ytext.toString()
                    );

                } catch (error) {
                    console.error(
                        "[YJS] Remote update error:",
                        error
                    );

                    remoteUpdateRef.current =
                        false;
                }
            }
        );

        // -----------------------------
        // LOCAL YJS UPDATE
        // -----------------------------

        const handleYjsUpdate =
            (update, origin) => {

                if (
                    origin === "remote"
                ) {
                    return;
                }

                if (
                    remoteUpdateRef.current
                ) {
                    return;
                }

                if (
                    !socket.connected
                ) {
                    return;
                }

                socket.emit(
                    "yjs-update",
                    {
                        roomId:
                            ROOM_ID,

                        update:
                            Array.from(
                                update
                            ),
                    }
                );
            };

        ydoc.on(
            "update",
            handleYjsUpdate
        );

        // -----------------------------
        // CLEANUP
        // -----------------------------

        return () => {
            ydoc.off(
                "update",
                handleYjsUpdate
            );

            if (
                socket.connected
            ) {
                socket.emit(
                    "leave-room",
                    {
                        roomId:
                            ROOM_ID,
                    }
                );
            }

            socket.disconnect();

            ydoc.destroy();

            socketRef.current =
                null;

            ydocRef.current =
                null;

            ytextRef.current =
                null;
        };
    }, []);

    // -----------------------------
    // MONACO CHANGE
    // -----------------------------

    const handleEditorChange =
        (value) => {

            if (
                value === undefined
            ) {
                return;
            }

            const ytext =
                ytextRef.current;

            if (!ytext) {
                setCode(value);
                return;
            }

            if (
                remoteUpdateRef.current
            ) {
                setCode(value);
                return;
            }

            const oldText =
                ytext.toString();

            if (
                oldText === value
            ) {
                return;
            }

            // Find changed section
            let start = 0;

            while (
                start <
                    oldText.length &&
                start <
                    value.length &&
                oldText[start] ===
                    value[start]
            ) {
                start++;
            }

            let oldEnd =
                oldText.length - 1;

            let newEnd =
                value.length - 1;

            while (
                oldEnd >= start &&
                newEnd >= start &&
                oldText[oldEnd] ===
                    value[newEnd]
            ) {
                oldEnd--;
                newEnd--;
            }

            const deleteCount =
                oldEnd - start + 1;

            const inserted =
                value.slice(
                    start,
                    newEnd + 1
                );

            ytext.doc.transact(
                () => {

                    if (
                        deleteCount > 0
                    ) {
                        ytext.delete(
                            start,
                            deleteCount
                        );
                    }

                    if (
                        inserted.length >
                        0
                    ) {
                        ytext.insert(
                            start,
                            inserted
                        );
                    }
                }
            );

            setCode(value);
        };

    // -----------------------------
    // RESET
    // -----------------------------

    const resetCode = () => {
        const ytext =
            ytextRef.current;

        if (!ytext) {
            return;
        }

        ytext.doc.transact(
            () => {

                if (
                    ytext.length > 0
                ) {
                    ytext.delete(
                        0,
                        ytext.length
                    );
                }

                ytext.insert(
                    0,
                    INITIAL_CODE
                );
            }
        );

        setCode(
            INITIAL_CODE
        );
    };

    // -----------------------------
    // COPY
    // -----------------------------

    const copyCode = async () => {
        try {
            await navigator.clipboard
                .writeText(code);
        } catch (error) {
            console.error(
                "Copy failed:",
                error
            );
        }
    };

    return (
        <div className="sync-editor">

            <div className="editor-topbar">

                <div className="editor-title-area">

                    <div className="editor-logo">
                        S
                    </div>

                    <div>
                        <h2>
                            SyncSpace Editor
                        </h2>

                        <p>
                            Real-time collaborative coding workspace
                        </p>
                    </div>

                </div>

                <div className="editor-actions">

                    <div className="active-pill">
                        {activeUsers} active
                    </div>

                    <div
                        className={
                            connected
                                ? "connection-pill online"
                                : "connection-pill offline"
                        }
                    >
                        <span className="connection-dot"></span>

                        {connected
                            ? "connected"
                            : "offline"}
                    </div>

                    <button
                        className="reset-button"
                        onClick={resetCode}
                        title="Reset code"
                    >
                        ↻
                    </button>

                </div>

            </div>

            <div className="editor-toolbar">

                <div className="file-info">

                    <span className="file-icon">
                        JS
                    </span>

                    <span className="file-name">
                        main.js
                    </span>

                </div>

                <span className="language-label">
                    JavaScript
                </span>

            </div>

            <div className="monaco-container">

                <Editor
                    height="500px"
                    language="javascript"
                    theme="vs-dark"
                    value={code}
                    onChange={
                        handleEditorChange
                    }
                    options={{
                        automaticLayout:
                            true,

                        minimap: {
                            enabled: true,
                        },

                        fontSize: 15,

                        lineHeight: 24,

                        tabSize: 4,

                        insertSpaces: true,

                        wordWrap:
                            "on",

                        scrollBeyondLastLine:
                            false,

                        smoothScrolling:
                            true,

                        cursorBlinking:
                            "smooth",

                        folding: true,

                        bracketPairColorization:
                        {
                            enabled: true,
                        },

                        padding: {
                            top: 16,
                            bottom: 16,
                        },
                    }}
                />

            </div>

            <div className="editor-statusbar">

                <div className="status-left">

                    <span>
                        main.js
                    </span>

                    <span>
                        JavaScript
                    </span>

                    <span>
                        UTF-8
                    </span>

                </div>

                <button
                    className="copy-button"
                    onClick={copyCode}
                >
                    Copy
                </button>

            </div>

        </div>
    );
}

export default CodeEditor;