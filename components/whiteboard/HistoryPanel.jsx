import { Button } from "@/components/ui/button";
import { History, Clock, X } from "lucide-react";
import {
  formatTimestamp,
  getActionIcon,
  getActionDescription,
} from "./historyUtils";

export default function HistoryPanel({
  showHistory,
  setShowHistory,
  actionHistory,
  restoreToHistoryPoint,
}) {
  if (!showHistory) return null;

  return (
    <div
      className="fixed top-32 right-6 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto"
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <History className="w-4 h-4" />
          Action History
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {actionHistory.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No actions yet</p>
      ) : (
        <div className="space-y-2">
          {actionHistory
            .slice()
            .reverse()
            .map((action, index) => (
              <div
                key={action.id}
                className="history-item flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group cursor-pointer"
                onClick={() => restoreToHistoryPoint(action.id)}
                title="Click to restore to this point"
              >
                <div className="flex items-center gap-2">
                  {getActionIcon(action.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {getActionDescription(action)}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(action.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto"
                  >
                    Restore
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
