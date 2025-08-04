import { Button } from "@/components/ui/button";
import {
  Undo,
  Redo,
  Eye,
  EyeOff,
  History,
  Settings,
  RotateCcw,
  Trash2,
  Save,
  Share2,
} from "lucide-react";
import { TOOLS } from "./constants";

export default function Toolbar({
  tool,
  setTool,
  setIsEraser,
  undo,
  redo,
  historyIndex,
  history,
  isGridVisible,
  setIsGridVisible,
  setShowHistory,
  setShowSettings,
  setShowShare,
  resetCanvas,
  handleClearCanvas,
  saveCanvas,
}) {
  return (
    <div className="space-y-4">
      {/* Drawing Tools */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Tools:</span>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {TOOLS.map((toolItem) => (
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
              onClick={() => {
                console.log("Share button clicked");
                setShowShare((prev) => {
                  console.log("Previous showShare:", prev);
                  return !prev;
                });
              }}
              className="flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all duration-200"
              title="Share Whiteboard"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory((prev) => !prev)}
              className="flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all duration-200"
              title="View History"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings((prev) => !prev)}
              className="flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all duration-200"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>

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
    </div>
  );
}
