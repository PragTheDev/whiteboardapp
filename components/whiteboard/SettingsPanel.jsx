export default function SettingsPanel({
  showSettings,
  canvasBackground,
  setCanvasBackground,
  isGridVisible,
  setIsGridVisible,
}) {
  if (!showSettings) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Canvas Settings</h3>
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
  );
}
