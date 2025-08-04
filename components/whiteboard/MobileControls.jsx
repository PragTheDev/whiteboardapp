import { Save, Undo, Redo, Trash2 } from "lucide-react";

export default function MobileControls({
  undo,
  redo,
  historyIndex,
  history,
  handleClearCanvas,
}) {
  return (
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
  );
}
