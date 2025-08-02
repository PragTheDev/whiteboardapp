"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
  Palette,
  Eraser,
  Download,
  Trash2,
  Undo,
  Redo,
  Save,
  Users,
} from "lucide-react";

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [socket, setSocket] = useState(null);
  const [isEraser, setIsEraser] = useState(false);
  const [tool, setTool] = useState("pen"); // pen, eraser, line, rectangle, circle
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [startPos, setStartPos] = useState(null);
  const [isShapeDrawing, setIsShapeDrawing] = useState(false);

  // Keep refs in sync with state
  useEffect(() => {
    historyRef.current = history;
    historyIndexRef.current = historyIndex;
  }, [history, historyIndex]);

  const colors = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#008000",
    "#000080",
    "#FF69B4",
    "#32CD32",
    "#FFD700",
    "#FF4500",
  ];

  const tools = [
    { id: "pen", name: "Pen", icon: "✏️" },
    { id: "eraser", name: "Eraser", icon: "🧽" },
    { id: "line", name: "Line", icon: "📏" },
    { id: "rectangle", name: "Rectangle", icon: "▭" },
    { id: "circle", name: "Circle", icon: "○" },
  ];

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    // Listen for drawing events from other users
    newSocket.on("drawing", (data) => {
      if (data.type === "path") {
        drawOnCanvas(data);
      } else if (data.type === "shape") {
        drawShape(data);
      }
    });

    // Listen for clear canvas events
    newSocket.on("clear-canvas", () => {
      clearCanvas();
    });

    // Listen for user count updates
    newSocket.on("user-count", (count) => {
      setConnectedUsers(count);
    });

    return () => newSocket.close();
  }, []);

  // Save canvas state for undo/redo
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const imageData = canvas.toDataURL();
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndexRef.current + 1);
        newHistory.push(imageData);
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    }
  }, []); // No dependencies to prevent infinite loops

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
            saveCanvas();
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
  }, []); // Remove dependencies to prevent re-registering event listeners

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      // Make canvas responsive
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth - 20;
        canvas.height = container.offsetHeight - 20;

        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };

      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, []); // Empty dependency array to run only once

  // Save initial canvas state after component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && history.length === 0) {
      const imageData = canvas.toDataURL();
      setHistory([imageData]);
      setHistoryIndex(0);
    }
  }, []); // Run only once on mount

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    const pos = getMousePos(e);
    setIsDrawing(true);

    if (tool === "pen" || tool === "eraser") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    } else {
      // For shapes, save starting position
      setStartPos(pos);
      setIsShapeDrawing(true);
    }
  };

  const draw = (e) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    if (!isDrawing) return;
    const pos = getMousePos(e);

    if (tool === "pen" || tool === "eraser") {
      const drawingData = {
        type: "path",
        x: pos.x,
        y: pos.y,
        color: tool === "eraser" ? "#FFFFFF" : currentColor,
        size: tool === "eraser" ? brushSize * 2 : brushSize,
        tool: tool,
      };

      drawOnCanvas(drawingData);

      // Emit drawing data to other users
      if (socket) {
        socket.emit("drawing", drawingData);
      }
    } else if (isShapeDrawing && startPos) {
      // Preview shape while drawing
      redrawCanvas();
      drawShapePreview(startPos, pos);
    }
  };

  const stopDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "pen" || tool === "eraser") {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      saveCanvasState();
    } else if (isShapeDrawing && startPos) {
      // Complete shape drawing
      const pos = getMousePos(e);
      const shapeData = {
        type: "shape",
        tool: tool,
        startPos: startPos,
        endPos: pos,
        color: currentColor,
        size: brushSize,
      };

      drawShape(shapeData);

      if (socket) {
        socket.emit("drawing", shapeData);
      }

      setIsShapeDrawing(false);
      setStartPos(null);
      saveCanvasState();
    }
  };

  const drawOnCanvas = (data) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (data.tool === "eraser" || data.color === "#FFFFFF") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
  };

  const drawShape = (data) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.fillStyle = data.color + "20"; // Semi-transparent fill

    const { startPos, endPos, tool } = data;
    const width = endPos.x - startPos.x;
    const height = endPos.y - startPos.y;

    ctx.beginPath();

    switch (tool) {
      case "line":
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(endPos.x, endPos.y);
        ctx.stroke();
        break;
      case "rectangle":
        ctx.rect(startPos.x, startPos.y, width, height);
        ctx.stroke();
        break;
      case "circle":
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = startPos.x + width / 2;
        const centerY = startPos.y + height / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }
  };

  const drawShapePreview = (start, end) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.setLineDash([5, 5]); // Dashed line for preview

    const width = end.x - start.x;
    const height = end.y - start.y;

    ctx.beginPath();

    switch (tool) {
      case "line":
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case "rectangle":
        ctx.rect(start.x, start.y, width, height);
        ctx.stroke();
        break;
      case "circle":
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = start.x + width / 2;
        const centerY = start.y + height / 2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }

    ctx.setLineDash([]); // Reset line dash
  };

  const redrawCanvas = useCallback(() => {
    if (historyRef.current.length > 0 && historyIndexRef.current >= 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = historyRef.current[historyIndexRef.current];
    }
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
  };

  const handleClearCanvas = () => {
    clearCanvas();
    if (socket) {
      socket.emit("clear-canvas");
    }
  };

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

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    link.download = `whiteboard-${timestamp}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white shadow-md p-4 space-y-4">
        {/* First Row - Tools */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-medium">Tools:</span>
            {tools.map((toolItem) => (
              <Button
                key={toolItem.id}
                variant={tool === toolItem.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTool(toolItem.id);
                  setIsEraser(toolItem.id === "eraser");
                }}
                className="flex items-center gap-2"
                title={toolItem.name}
              >
                <span>{toolItem.icon}</span>
                {toolItem.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="flex items-center gap-2"
            >
              <Undo className="w-4 h-4" />
              Undo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="flex items-center gap-2"
            >
              <Redo className="w-4 h-4" />
              Redo
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCanvas}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={saveCanvas}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Second Row - Colors and Brush Size */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <span className="font-medium">Colors:</span>
            <div className="flex gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    currentColor === color
                      ? "border-gray-800 scale-110"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setCurrentColor(color);
                    if (tool === "eraser") setTool("pen");
                  }}
                  title={`Color: ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Brush Size:</span>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600 min-w-[40px]">
              {brushSize}px
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Users className="w-4 h-4" />
            <span className="text-sm text-gray-600">
              {connectedUsers} user{connectedUsers !== 1 ? "s" : ""} online
            </span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 min-h-0">
        <canvas
          ref={canvasRef}
          className={`border border-gray-300 bg-white rounded-lg shadow-lg w-full h-full touch-none ${
            tool === "pen"
              ? "cursor-crosshair"
              : tool === "eraser"
              ? "cursor-cell"
              : "cursor-crosshair"
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Status */}
      <div className="bg-white border-t p-3 text-sm text-gray-600">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            {socket?.connected ? (
              <span className="text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Connected - Real-time collaboration active
              </span>
            ) : (
              <span className="text-red-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Disconnected
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span>
              Tool: <strong>{tools.find((t) => t.id === tool)?.name}</strong>
            </span>
            <span>
              Color:{" "}
              <span
                className="inline-block w-3 h-3 rounded-full border ml-1"
                style={{ backgroundColor: currentColor }}
              ></span>
            </span>
            <span>
              Size: <strong>{brushSize}px</strong>
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Shortcuts: P(en), E(raser), L(ine), R(ectangle), C(ircle) | Ctrl+Z
          (Undo), Ctrl+Y (Redo), Ctrl+S (Save)
        </div>
      </div>
    </div>
  );
}

