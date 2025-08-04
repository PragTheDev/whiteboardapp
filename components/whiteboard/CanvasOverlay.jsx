import { Save } from "lucide-react";

export default function CanvasOverlay({
  tool,
  currentColor,
  showSaveNotification,
  isCanvasReady,
}) {
  const tools = [
    { id: "pen", name: "Pen" },
    { id: "eraser", name: "Eraser" },
    { id: "line", name: "Line" },
    { id: "rectangle", name: "Rectangle" },
    { id: "circle", name: "Circle" },
  ];

  return (
    <>
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
    </>
  );
}
