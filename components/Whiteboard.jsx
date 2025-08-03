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
  Minus,
  Plus,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  Settings,
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
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState("#FFFFFF");
  const [showSettings, setShowSettings] = useState(false);
  const previewCanvasRef = useRef(null);

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
    "#8B4513",
    "#FF1493",
    "#00CED1",
    "#9370DB",
    "#20B2AA",
    "#DC143C",
    "#4169E1",
    "#228B22",
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

  // Helper function to validate hex colors
  const isValidHexColor = (color) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  // Helper function to handle custom color changes
  const handleCustomColorChange = (color) => {
    setCustomColor(color);
    if (isValidHexColor(color)) {
      setCurrentColor(color);
      if (tool === "eraser") setTool("pen");
    }
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker && !event.target.closest(".color-picker-container")) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

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
    const previewCanvas = previewCanvasRef.current;

    if (canvas && previewCanvas) {
      // Make canvas responsive
      const resizeCanvas = () => {
        const container = canvas.parentElement;
        const width = container.offsetWidth - 20;
        const height = container.offsetHeight - 20;

        // Resize main canvas
        canvas.width = width;
        canvas.height = height;

        // Resize preview canvas to match
        previewCanvas.width = width;
        previewCanvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.fillStyle = canvasBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid if enabled
        if (isGridVisible) {
          drawGrid(ctx, canvas.width, canvas.height);
        }

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
    
    // Initialize custom color with current color
    setCustomColor(currentColor);
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
      // For shapes, just save starting position
      setStartPos(pos);
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
    } else if (startPos) {
      // For shapes, draw preview
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
    } else if (startPos) {
      // Complete shape drawing
      const pos = getMousePos(e);

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

      drawShape(shapeData);

      if (socket) {
        socket.emit("drawing", shapeData);
      }

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
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

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
        ctx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
        ctx.stroke();
        break;
    }
  };

  const drawShapePreview = (start, end) => {
    const canvas = canvasRef.current;
    const previewCanvas = previewCanvasRef.current;

    if (!canvas || !previewCanvas) return;

    const previewCtx = previewCanvas.getContext("2d");

    // Clear preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Set preview style
    previewCtx.globalCompositeOperation = "source-over";
    previewCtx.strokeStyle = currentColor;
    previewCtx.lineWidth = brushSize;
    previewCtx.lineCap = "round";
    previewCtx.lineJoin = "round";
    previewCtx.setLineDash([5, 5]); // Dashed line for preview

    const width = end.x - start.x;
    const height = end.y - start.y;

    previewCtx.beginPath();

    switch (tool) {
      case "line":
        previewCtx.moveTo(start.x, start.y);
        previewCtx.lineTo(end.x, end.y);
        previewCtx.stroke();
        break;
      case "rectangle":
        previewCtx.rect(start.x, start.y, width, height);
        previewCtx.stroke();
        break;
      case "circle":
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = start.x + width / 2;
        const centerY = start.y + height / 2;
        previewCtx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
        previewCtx.stroke();
        break;
    }

    // Reset line dash
    previewCtx.setLineDash([]);
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

  const restoreCanvasFromImageData = (imageData) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = imageData;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw grid if enabled
    if (isGridVisible) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    saveCanvasState();
  };

  const drawGrid = (ctx, width, height) => {
    const gridSize = 20;
    ctx.save();
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]);

    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  };

  const loadImageToCanvas = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = canvasBackground;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid if enabled
        if (isGridVisible) {
          drawGrid(ctx, canvas.width, canvas.height);
        }

        // Calculate aspect ratio and draw image
        const aspectRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.width / aspectRatio;

        if (drawHeight > canvas.height) {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
        }

        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;

        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        saveCanvasState();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      loadImageToCanvas(file);
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = canvasBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isGridVisible) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    // Reset history
    setHistory([]);
    setHistoryIndex(-1);
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
                <h1 className="text-xl font-bold text-gray-900">
                  Collaborative Whiteboard
                </h1>
                <p className="text-sm text-gray-500">
                  Draw, share, and create together
                </p>
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
                  <span className="text-sm font-medium text-green-700">
                    Connected
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-red-700">
                    Disconnected
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tools Section */}
          <div className="space-y-4">
            {/* Drawing Tools */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  Tools:
                </span>
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
                          ? "bg-blue-500 text-white shadow-md transform scale-105"
                          : "hover:bg-white hover:shadow-sm"
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
                    onClick={() => setIsGridVisible(!isGridVisible)}
                    className={`flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all duration-200 ${
                      isGridVisible ? "bg-blue-50 text-blue-600" : ""
                    }`}
                    title="Toggle Grid"
                  >
                    {isGridVisible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Grid</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all duration-200"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                  </Button>

                  <label className="flex items-center gap-2 px-3 py-2 hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer rounded-md text-sm font-medium text-gray-700">
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetCanvas}
                    className="flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 hover:shadow-sm transition-all duration-200"
                    title="Reset Canvas"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset</span>
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
                <div className="relative color-picker-container">
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
                          setCustomColor(color);
                          if (tool === "eraser") setTool("pen");
                        }}
                        title={`Color: ${color}`}
                      />
                    ))}

                    {/* Custom Color Picker Button */}
                    <button
                      className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center hover:border-gray-600 transition-all duration-200"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      title="Custom Color"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Custom Color Picker Modal */}
                  {showColorPicker && (
                    <div className="absolute top-12 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-gray-700">
                          Custom Color
                        </div>
                        <input
                          type="color"
                          value={isValidHexColor(customColor) ? customColor : "#000000"}
                          onChange={(e) => {
                            handleCustomColorChange(e.target.value);
                          }}
                          className="w-16 h-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => {
                              handleCustomColorChange(e.target.value);
                            }}
                            onBlur={(e) => {
                              // Validate and fix the color on blur
                              const value = e.target.value;
                              if (!value.startsWith('#')) {
                                const fixedColor = '#' + value;
                                if (isValidHexColor(fixedColor)) {
                                  handleCustomColorChange(fixedColor);
                                } else {
                                  setCustomColor(currentColor); // Reset to current color if invalid
                                }
                              } else if (!isValidHexColor(value)) {
                                setCustomColor(currentColor); // Reset to current color if invalid
                              }
                            }}
                            className={`px-2 py-1 text-xs border rounded w-24 ${
                              isValidHexColor(customColor) 
                                ? 'border-gray-300' 
                                : 'border-red-300 bg-red-50'
                            }`}
                            placeholder="#000000"
                          />
                          <Button
                            size="sm"
                            onClick={() => setShowColorPicker(false)}
                            className="text-xs"
                          >
                            Done
                          </Button>
                        </div>
                        {!isValidHexColor(customColor) && customColor && (
                          <div className="text-xs text-red-600">
                            Invalid color format. Use #RRGGBB or #RGB
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-px h-6 bg-gray-300"></div>
                <span className="text-sm font-semibold text-gray-700">
                  Brush Size:
                </span>
                <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                        (brushSize / 50) * 100
                      }%, #e5e7eb ${(brushSize / 50) * 100}%, #e5e7eb 100%)`,
                    }}
                  />

                  <button
                    onClick={() => setBrushSize(Math.min(50, brushSize + 1))}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2 min-w-[60px]">
                    <div
                      className="bg-gray-800 rounded-full"
                      style={{
                        width: `${Math.max(4, Math.min(20, brushSize))}px`,
                        height: `${Math.max(4, Math.min(20, brushSize))}px`,
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-600">
                      {brushSize}px
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Canvas Settings
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Background:</label>
                    <input
                      type="color"
                      value={canvasBackground}
                      onChange={(e) => setCanvasBackground(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={isGridVisible}
                        onChange={(e) => setIsGridVisible(e.target.checked)}
                        className="mr-1"
                      />
                      Show Grid
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 min-h-0">
        <div
          className={`relative h-full rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ${
            !isCanvasReady ? "canvas-loading" : ""
          }`}
          style={{ backgroundColor: canvasBackground }}
        >
          {/* Canvas */}
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
              // Clear preview when leaving canvas
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

          {/* Preview Canvas for Shape Drawing */}
          <canvas
            ref={previewCanvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
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
              <span className="font-medium">
                {tools.find((t) => t.id === tool)?.name}
              </span>
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
              <span className="text-sm font-medium">
                Canvas saved successfully!
              </span>
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
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                P
              </kbd>{" "}
              Pen,
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                E
              </kbd>{" "}
              Eraser,
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                L
              </kbd>{" "}
              Line,
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                R
              </kbd>{" "}
              Rectangle,
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                C
              </kbd>{" "}
              Circle
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                Ctrl+Z
              </kbd>{" "}
              Undo,
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                Ctrl+Y
              </kbd>{" "}
              Redo,
              <kbd className="ml-1 px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                Ctrl+S
              </kbd>{" "}
              Save
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
