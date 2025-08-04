"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_COLOR,
  DEFAULT_CANVAS_BACKGROUND,
} from "./whiteboard/constants";
import {
  getMousePos,
  drawOnCanvas,
  drawShape,
  drawShapePreview,
  clearCanvas,
  loadImageToCanvas,
  saveCanvas,
} from "./whiteboard/utils";
import Header from "./whiteboard/Header";
import Toolbar from "./whiteboard/Toolbar";
import ColorPalette from "./whiteboard/ColorPalette";
import SettingsPanel from "./whiteboard/SettingsPanel";
import HistoryPanel from "./whiteboard/HistoryPanel";
import SharePanel from "./whiteboard/SharePanel";
import CanvasOverlay from "./whiteboard/CanvasOverlay";
import MobileControls from "./whiteboard/MobileControls";
import Footer from "./whiteboard/Footer";

export default function Whiteboard({ roomId = null }) {
  const router = useRouter();
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const previewCanvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const [socket, setSocket] = useState(null);
  const [isEraser, setIsEraser] = useState(false);
  const [tool, setTool] = useState("pen");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [startPos, setStartPos] = useState(null);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState(
    DEFAULT_CANVAS_BACKGROUND
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [actionHistory, setActionHistory] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(roomId);

  // Keep refs in sync with state
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  // Socket connection and room handling
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    // Handle room creation
    newSocket.on("room-created", (newRoomId) => {
      console.log("Room created:", newRoomId);
      setCurrentRoomId(newRoomId);
      router.push(`/room/${newRoomId}`);
    });

    // Handle room joining
    newSocket.on("room-joined", (joinedRoomId) => {
      console.log("Room joined:", joinedRoomId);
      setCurrentRoomId(joinedRoomId);
    });

    // Handle canvas restoration
    newSocket.on("canvas-restored", (canvasData) => {
      if (canvasData && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = canvasData;
      }
    });

    newSocket.on("drawing", (data) => {
      if (data.type === "path") {
        drawOnCanvas(canvasRef.current, data);
      } else if (data.type === "shape") {
        drawShape(canvasRef.current, data);
      }
    });

    newSocket.on("clear-canvas", () => {
      clearCanvas(canvasRef.current, canvasBackground, isGridVisible);
    });

    newSocket.on("user-count", (count) => {
      setConnectedUsers(count);
    });

    // Join room when socket connects
    newSocket.on("connect", () => {
      newSocket.emit("join-room", roomId);
    });

    return () => newSocket.close();
  }, [roomId]);

  // Save canvas state for undo/redo and emit to server
  const saveCanvasState = useCallback(
    (actionType = "draw", details = {}) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const imageData = canvas.toDataURL();
        const timestamp = new Date();

        // Save canvas state to server for room persistence
        if (socket && currentRoomId) {
          socket.emit("save-canvas-state", imageData);
        }

        const historyEntry = {
          id: Date.now() + Math.random(),
          type: actionType,
          timestamp: timestamp,
          details: details,
          imageData: imageData,
        };

        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndexRef.current + 1);
          newHistory.push(imageData);
          return newHistory;
        });

        setActionHistory((prev) => {
          const newActionHistory = prev.slice(0, historyIndexRef.current + 1);
          newActionHistory.push(historyEntry);
          return newActionHistory;
        });

        setHistoryIndex((prev) => prev + 1);
      }
    },
    [socket, currentRoomId]
  );

  // Update canvas background when changed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && isCanvasReady) {
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = canvasBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);

      if (isGridVisible) {
        const { drawGrid } = require("./whiteboard/utils");
        drawGrid(ctx, canvas.width, canvas.height);
      }
    }
  }, [canvasBackground, isGridVisible, isCanvasReady]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case "y":
            e.preventDefault();
            redo();
            break;
          case "s":
            e.preventDefault();
            saveCanvas(canvasRef.current, setShowSaveNotification);
            break;
          case "Delete":
          case "Backspace":
            e.preventDefault();
            handleClearCanvas();
            break;
        }
      }

      // Tool shortcuts
      switch (e.key) {
        case "p":
          setTool("pen");
          setIsEraser(false);
          break;
        case "e":
          setTool("eraser");
          setIsEraser(true);
          break;
        case "l":
          setTool("line");
          setIsEraser(false);
          break;
        case "r":
          setTool("rectangle");
          setIsEraser(false);
          break;
        case "c":
          setTool("circle");
          setIsEraser(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (canvas && previewCanvas) {
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        const width = container.offsetWidth - 20;
        const height = container.offsetHeight - 20;

        canvas.width = width;
        canvas.height = height;
        previewCanvas.width = width;
        previewCanvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = canvasBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (isGridVisible) {
          const { drawGrid } = require("./whiteboard/utils");
          drawGrid(ctx, canvas.width, canvas.height);
        }

        setIsCanvasReady(true);
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, []);

  // Save initial canvas state
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && history.length === 0) {
      const imageData = canvas.toDataURL();
      setHistory([imageData]);
      setHistoryIndex(0);
    }
  }, []);

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getMousePos(e, canvasRef.current);
    setIsDrawing(true);

    if (tool === "pen" || tool === "eraser") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      setStartPos(pos);
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getMousePos(e, canvasRef.current);

    if (tool === "pen" || tool === "eraser") {
      const drawingData = {
        type: "path",
        x: pos.x,
        y: pos.y,
        color: tool === "eraser" ? "#FFFFFF" : currentColor,
        size: tool === "eraser" ? brushSize * 2 : brushSize,
        tool: tool,
      };

      drawOnCanvas(canvasRef.current, drawingData);

      if (socket) {
        socket.emit("drawing", drawingData);
      }
    } else if (startPos) {
      drawShapePreview(
        previewCanvasRef.current,
        startPos,
        pos,
        tool,
        currentColor,
        brushSize
      );
    }
  };

  const stopDrawing = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "pen" || tool === "eraser") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      const actionType = tool === "pen" ? "draw" : "erase";
      saveCanvasState(actionType, {
        tool,
        color: currentColor,
        size: brushSize,
      });
    } else if (startPos) {
      const pos = getMousePos(e, canvasRef.current);

      // Clear preview canvas
      const previewCanvas = previewCanvasRef.current;
      if (previewCanvas) {
        const previewCtx = previewCanvas.getContext("2d");
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      }

      const shapeData = {
        type: "shape",
        tool: tool,
        startPos: startPos,
        endPos: pos,
        color: currentColor,
        size: brushSize,
      };

      drawShape(canvasRef.current, shapeData);

      if (socket) {
        socket.emit("drawing", shapeData);
      }

      setStartPos(null);
      saveCanvasState("shape", {
        tool,
        color: currentColor,
        size: brushSize,
        startPos,
        endPos: pos,
      });
    }
  };

  const resetCanvas = () => {
    clearCanvas(canvasRef.current, canvasBackground, isGridVisible);
    setHistory([]);
    setHistoryIndex(-1);
    setActionHistory([]);
    saveCanvasState("reset", { background: canvasBackground });
  };

  const createNewRoom = () => {
    console.log("Creating new room...");
    if (socket) {
      // Request creation of a new room by passing null as roomId
      socket.emit("join-room", null);
      console.log("Emitted join-room with null");
    }
  };

  const handleClearCanvas = () => {
    clearCanvas(canvasRef.current, canvasBackground, isGridVisible);
    if (socket) {
      socket.emit("clear-canvas");
    }
    saveCanvasState("clear", { background: canvasBackground });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      loadImageToCanvas(
        canvasRef.current,
        file,
        canvasBackground,
        isGridVisible,
        saveCanvasState
      );
    }
  };

  const restoreToHistoryPoint = useCallback(
    (historyId) => {
      const actionIndex = actionHistory.findIndex(
        (action) => action.id === historyId
      );
      if (actionIndex === -1) return;

      const action = actionHistory[actionIndex];
      if (action.imageData) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);

          const newHistory = [
            ...history.slice(0, historyIndex + 1),
            action.imageData,
          ];
          setHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);

          if (socket) {
            socket.emit("canvas-cleared");
            socket.emit("canvas-restored", action.imageData);
          }
        };
        img.src = action.imageData;

        setShowHistory(false);
      }
    },
    [actionHistory, history, historyIndex, socket]
  );

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = historyRef.current[newIndex];
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1;
      setHistoryIndex(newIndex);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = historyRef.current[newIndex];
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header 
        connectedUsers={connectedUsers} 
        socket={socket} 
        roomId={currentRoomId}
        onCreateRoom={createNewRoom}
      />

      <div className="px-6 py-4">
        <Toolbar
          tool={tool}
          setTool={setTool}
          setIsEraser={setIsEraser}
          undo={undo}
          redo={redo}
          historyIndex={historyIndex}
          history={history}
          isGridVisible={isGridVisible}
          setIsGridVisible={setIsGridVisible}
          setShowHistory={setShowHistory}
          setShowSettings={setShowSettings}
          setShowShare={setShowShare}
          handleImageUpload={handleImageUpload}
          resetCanvas={resetCanvas}
          handleClearCanvas={handleClearCanvas}
          saveCanvas={() =>
            saveCanvas(canvasRef.current, setShowSaveNotification)
          }
        />

        <ColorPalette
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          tool={tool}
          setTool={setTool}
        />

        <SettingsPanel
          showSettings={showSettings}
          canvasBackground={canvasBackground}
          setCanvasBackground={setCanvasBackground}
          isGridVisible={isGridVisible}
          setIsGridVisible={setIsGridVisible}
        />
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 min-h-0">
        <div
          className={`relative h-full rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 canvas-container ${
            !isCanvasReady ? "canvas-loading" : ""
          }`}
          style={{ backgroundColor: canvasBackground, zIndex: 1 }}
        >
          <canvas
            ref={canvasRef}
            className={`w-full h-full touch-none transition-all duration-200 ${
              tool === "pen"
                ? "cursor-crosshair"
                : tool === "eraser"
                ? "cursor-cell"
                : "cursor-crosshair"
            } ${!isCanvasReady ? "opacity-0" : "opacity-100"}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={(e) => {
              const previewCanvas = previewCanvasRef.current;
              if (previewCanvas && startPos) {
                const previewCtx = previewCanvas.getContext("2d");
                previewCtx.clearRect(
                  0,
                  0,
                  previewCanvas.width,
                  previewCanvas.height
                );
              }
              stopDrawing(e);
            }}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          <canvas
            ref={previewCanvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none preview-canvas"
            style={{ zIndex: 2 }}
          />

          <CanvasOverlay
            tool={tool}
            currentColor={currentColor}
            showSaveNotification={showSaveNotification}
            isCanvasReady={isCanvasReady}
          />

          <MobileControls
            undo={undo}
            redo={redo}
            historyIndex={historyIndex}
            history={history}
            handleClearCanvas={handleClearCanvas}
          />
        </div>
      </div>

      <Footer />

      <HistoryPanel
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        actionHistory={actionHistory}
        restoreToHistoryPoint={restoreToHistoryPoint}
      />

      <SharePanel
        roomId={currentRoomId}
        connectedUsers={connectedUsers}
        onCreateRoom={createNewRoom}
        showShare={showShare}
        setShowShare={setShowShare}
      />

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black text-white p-2 rounded text-xs space-y-2">
          <div>Room ID: {currentRoomId || 'null'} | Show Share: {showShare.toString()}</div>
          <button 
            onClick={() => setShowShare(!showShare)}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Toggle Share Panel
          </button>
        </div>
      )}
    </div>
  );
}
