'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Palette, Eraser, Download, Trash2 } from 'lucide-react';

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [socket, setSocket] = useState(null);
  const [isEraser, setIsEraser] = useState(false);

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io();
    setSocket(newSocket);

    // Listen for drawing events from other users
    newSocket.on('drawing', (data) => {
      drawOnCanvas(data);
    });

    // Listen for clear canvas events
    newSocket.on('clear-canvas', () => {
      clearCanvas();
    });

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (canvas) {
      canvas.width = window.innerWidth - 100;
      canvas.height = window.innerHeight - 200;
      
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const drawingData = {
      x,
      y,
      color: isEraser ? '#FFFFFF' : currentColor,
      size: isEraser ? brushSize * 3 : brushSize,
      isDrawing: true
    };

    drawOnCanvas(drawingData);
    
    // Emit drawing data to other users
    if (socket) {
      socket.emit('drawing', drawingData);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
  };

  const drawOnCanvas = (data) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (data.color === '#FFFFFF') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClearCanvas = () => {
    clearCanvas();
    if (socket) {
      socket.emit('clear-canvas');
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white shadow-md p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <span className="font-medium">Colors:</span>
          {colors.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded-full border-2 ${
                currentColor === color ? 'border-gray-800' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setCurrentColor(color);
                setIsEraser(false);
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">Brush Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{brushSize}px</span>
        </div>

        <Button
          variant={isEraser ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEraser(!isEraser)}
          className="flex items-center gap-2"
        >
          <Eraser className="w-4 h-4" />
          Eraser
        </Button>

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
          onClick={downloadCanvas}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 bg-white rounded-lg shadow-lg cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Status */}
      <div className="bg-white border-t p-2 text-sm text-gray-600 text-center">
        {socket?.connected ? (
          <span className="text-green-600">● Connected - Draw and collaborate in real-time!</span>
        ) : (
          <span className="text-red-600">● Disconnected</span>
        )}
      </div>
    </div>
  );
}
