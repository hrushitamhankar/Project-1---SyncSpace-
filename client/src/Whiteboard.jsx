import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

const ROOM_NAME =
    "syncspace-code-room-v4";

function Whiteboard() {
    const canvasRef = useRef(null);
    const socketRef = useRef(null);

    const drawingRef = useRef(false);
    const lastPointRef = useRef(null);

    const [connected, setConnected] =
        useState(false);

    const [brushSize, setBrushSize] =
        useState(4);

    const [brushColor, setBrushColor] =
        useState("#7c3aed");

    useEffect(() => {
        const canvas =
            canvasRef.current;

        if (!canvas) return;

        const resizeCanvas = () => {
            const rect =
                canvas.getBoundingClientRect();

            const dpr =
                window.devicePixelRatio || 1;

            const oldCanvas =
                document.createElement(
                    "canvas"
                );

            oldCanvas.width =
                canvas.width;

            oldCanvas.height =
                canvas.height;

            const oldContext =
                oldCanvas.getContext("2d");

            if (
                canvas.width > 0 &&
                canvas.height > 0
            ) {
                oldContext.drawImage(
                    canvas,
                    0,
                    0
                );
            }

            canvas.width =
                rect.width * dpr;

            canvas.height =
                rect.height * dpr;

            const context =
                canvas.getContext("2d");

            context.scale(dpr, dpr);

            context.lineCap = "round";
            context.lineJoin = "round";

            if (
                oldCanvas.width > 0 &&
                oldCanvas.height > 0
            ) {
                context.drawImage(
                    oldCanvas,
                    0,
                    0,
                    oldCanvas.width,
                    oldCanvas.height,
                    0,
                    0,
                    rect.width,
                    rect.height
                );
            }
        };

        resizeCanvas();

        window.addEventListener(
            "resize",
            resizeCanvas
        );

        const socket =
            io(SERVER_URL, {
                transports: [
                    "websocket",
                    "polling",
                ],
            });

        socketRef.current =
            socket;

        socket.on(
            "connect",
            () => {
                console.log(
                    "[WHITEBOARD] Connected"
                );

                setConnected(true);

                socket.emit(
                    "joinWhiteboard",
                    ROOM_NAME
                );
            }
        );

        socket.on(
            "disconnect",
            () => {
                setConnected(false);
            }
        );

        socket.on(
            "connect_error",
            (error) => {
                console.error(
                    "[WHITEBOARD]",
                    error.message
                );

                setConnected(false);
            }
        );

        socket.on(
            "whiteboard-draw",
            (data) => {
                if (
                    !data?.from ||
                    !data?.to
                ) {
                    return;
                }

                drawLine(
                    data.from,
                    data.to,
                    data.color,
                    data.size
                );
            }
        );

        socket.on(
            "whiteboard-clear",
            () => {
                clearCanvas();
            }
        );

        return () => {
            socket.emit(
                "leaveWhiteboard",
                ROOM_NAME
            );

            socket.disconnect();

            window.removeEventListener(
                "resize",
                resizeCanvas
            );
        };
    }, []);

    const getPoint = (event) => {
        const canvas =
            canvasRef.current;

        const rect =
            canvas.getBoundingClientRect();

        return {
            x:
                event.clientX -
                rect.left,

            y:
                event.clientY -
                rect.top,
        };
    };

    const drawLine = (
        from,
        to,
        color = brushColor,
        size = brushSize
    ) => {
        const canvas =
            canvasRef.current;

        if (!canvas) return;

        const context =
            canvas.getContext("2d");

        context.strokeStyle =
            color;

        context.lineWidth =
            size;

        context.lineCap =
            "round";

        context.lineJoin =
            "round";

        context.beginPath();

        context.moveTo(
            from.x,
            from.y
        );

        context.lineTo(
            to.x,
            to.y
        );

        context.stroke();
    };

    const handlePointerDown =
        (event) => {
            drawingRef.current =
                true;

            lastPointRef.current =
                getPoint(event);

            canvasRef.current.setPointerCapture(
                event.pointerId
            );
        };

    const handlePointerMove =
        (event) => {
            if (
                !drawingRef.current
            ) {
                return;
            }

            const currentPoint =
                getPoint(event);

            const previousPoint =
                lastPointRef.current;

            if (!previousPoint) {
                lastPointRef.current =
                    currentPoint;

                return;
            }

            drawLine(
                previousPoint,
                currentPoint,
                brushColor,
                brushSize
            );

            socketRef.current?.emit(
                "whiteboard-draw",
                {
                    roomId:
                        ROOM_NAME,

                    from:
                        previousPoint,

                    to:
                        currentPoint,

                    color:
                        brushColor,

                    size:
                        brushSize,
                }
            );

            lastPointRef.current =
                currentPoint;
        };

    const stopDrawing =
        (event) => {
            drawingRef.current =
                false;

            lastPointRef.current =
                null;

            if (
                event?.pointerId !==
                undefined
            ) {
                try {
                    canvasRef.current.releasePointerCapture(
                        event.pointerId
                    );
                } catch {
                    // Ignore
                }
            }
        };

    const clearCanvas = () => {
        const canvas =
            canvasRef.current;

        if (!canvas) return;

        const context =
            canvas.getContext("2d");

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    };

    const handleClear = () => {
        clearCanvas();

        socketRef.current?.emit(
            "whiteboard-clear",
            {
                roomId:
                    ROOM_NAME,
            }
        );
    };

    return (
        <div className="whiteboard-container">

            <div className="whiteboard-toolbar">

                <div className="whiteboard-title">

                    <span className="whiteboard-icon">
                        ✦
                    </span>

                    <div>
                        <strong>
                            Collaborative Whiteboard
                        </strong>

                        <small>
                            Draw together in real time
                        </small>
                    </div>

                </div>

                <div className="whiteboard-tools">

                    <label>
                        Color

                        <input
                            type="color"
                            value={brushColor}
                            onChange={(event) =>
                                setBrushColor(
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label>
                        Size

                        <input
                            type="range"
                            min="1"
                            max="16"
                            value={brushSize}
                            onChange={(event) =>
                                setBrushSize(
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                        />
                    </label>

                    <button
                        type="button"
                        onClick={handleClear}
                    >
                        Clear
                    </button>

                    <span
                        className={
                            connected
                                ? "whiteboard-status online"
                                : "whiteboard-status"
                        }
                    >
                        <span />
                        {connected
                            ? "Live"
                            : "Offline"}
                    </span>

                </div>

            </div>

            <div className="whiteboard-canvas-wrapper">

                <canvas
                    ref={canvasRef}
                    className="whiteboard-canvas"
                    onPointerDown={
                        handlePointerDown
                    }
                    onPointerMove={
                        handlePointerMove
                    }
                    onPointerUp={
                        stopDrawing
                    }
                    onPointerCancel={
                        stopDrawing
                    }
                    onPointerLeave={
                        stopDrawing
                    }
                />

                <div className="whiteboard-hint">
                    Click and drag to draw
                </div>

            </div>

        </div>
    );
}

export default Whiteboard;