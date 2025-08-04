export default function Footer() {
  return (
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
  );
}
