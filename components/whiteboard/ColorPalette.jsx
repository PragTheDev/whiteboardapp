import { Button } from "@/components/ui/button";
import { Palette, Minus, Plus } from "lucide-react";
import { COLORS } from "./constants";

export default function ColorPalette({
  currentColor,
  setCurrentColor,
  brushSize,
  setBrushSize,
  tool,
  setTool,
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Colors:
        </span>
        <div className="flex gap-1 p-2 bg-gray-100 rounded-lg">
          {COLORS.map((color) => (
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
  );
}
