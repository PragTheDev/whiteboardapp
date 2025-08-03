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
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

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
        
        setIsCanvasReady(true);
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
    
    // Show save notification
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">✏️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Collaborative Whiteboard</h1>
                <p className="text-sm text-gray-500">Draw, share, and create together</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {connectedUsers} user{connectedUsers !== 1 ? "s" : ""} online
                </span>
              </div>
              
              {socket?.connected ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">Disconnected</span>
                </div>
              )}
            </div>
          </div>

          {/* Tools Section */}
          <div className="space-y-4">
            {/* Drawing Tools */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Tools:</span>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  {tools.map((toolItem) => (
                    <Button
                      key={toolItem.id}
                      variant={tool === toolItem.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setTool(toolItem.id);
                        setIsEraser(toolItem.id === "eraser");
                      }}
                      className={`flex items-center gap-2 transition-all duration-200 ${
                        tool === toolItem.id 
                          ? 'bg-blue-500 text-white shadow-md transform scale-105' 
                          : 'hover:bg-white hover:shadow-sm'
                      }`}
                      title={toolItem.name}
                    >
                      <span className="text-base">{toolItem.icon}</span>
                      <span className="hidden sm:inline">{toolItem.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    className="flex items-center gap-2 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo className="w-4 h-4" />
                    <span className="hidden sm:inline">Undo</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className="flex items-center gap-2 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4" />
                    <span className="hidden sm:inline">Redo</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCanvas}
                    className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all duration-200"
                    title="Clear Canvas"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveCanvas}
                    className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 hover:shadow-sm transition-all duration-200"
                    title="Save Canvas (Ctrl+S)"
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Color Palette and Brush Size */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Colors:
                </span>
                <div className="flex gap-1 p-2 bg-gray-100 rounded-lg">
                  {colors.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                        currentColor === color
                          ? "border-gray-800 scale-110 shadow-md ring-2 ring-blue-200"
                          : "border-gray-300 hover:border-gray-400"
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

              <div className="flex items-center gap-3">
                <div className="w-px h-6 bg-gray-300"></div>
                <span className="text-sm font-semibold text-gray-700">Brush Size:</span>
                <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(brushSize / 50) * 100}%, #e5e7eb ${(brushSize / 50) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <div 
                      className="bg-gray-800 rounded-full"
                      style={{
                        width: `${Math.max(4, Math.min(20, brushSize))}px`,
                        height: `${Math.max(4, Math.min(20, brushSize))}px`
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-600">{brushSize}px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 min-h-0">
        <div className={`relative h-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ${
          !isCanvasReady ? 'canvas-loading' : ''
        }`}>
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={`w-full h-full touch-none transition-all duration-200 ${
              tool === "pen"
                ? "cursor-crosshair"
                : tool === "eraser"
                ? "cursor-cell"
                : "cursor-crosshair"
            } ${!isCanvasReady ? 'opacity-0' : 'opacity-100'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          {/* Canvas Loading State */}
          {!isCanvasReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-500">Preparing canvas...</p>
              </div>
            </div>
          )}
          
          {/* Canvas Overlay Info */}
          <div className="absolute top-4 right-4 flex items-center gap-2 fade-in">
            <div className="px-3 py-1 bg-black/10 backdrop-blur-sm rounded-lg text-sm text-gray-700 shadow-sm">
              <span className="font-medium">{tools.find((t) => t.id === tool)?.name}</span>
            </div>
            <div 
              className="w-6 h-6 rounded-lg border-2 border-white shadow-sm transition-transform hover:scale-110"
              style={{ backgroundColor: currentColor }}
              title={`Current color: ${currentColor}`}
            />
          </div>

          {/* Save Notification */}
          {showSaveNotification && (
            <div className="absolute top-4 left-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg fade-in flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Canvas saved successfully!</span>
            </div>
          )}

          {/* Mobile Floating Action Button */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 md:hidden">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed"
            >
              <Undo className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed"
            >
              <Redo className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearCanvas}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/80 backdrop-blur-md border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              <strong>Keyboard Shortcuts:</strong> 
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">P</kbd> Pen, 
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">E</kbd> Eraser, 
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">L</kbd> Line, 
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">R</kbd> Rectangle, 
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">C</kbd> Circle
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+Z</kbd> Undo, 
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+Y</kbd> Redo, 
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl+S</kbd> Save
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
