// History utilities for whiteboard

export const formatTimestamp = (timestamp) => {
  const now = new Date();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 10) return `${seconds}s ago`;
  return "Just now";
};

export const getActionIcon = (type) => {
  switch (type) {
    case "draw":
      return "✏️";
    case "erase":
      return "🧽";
    case "shape":
      return "🔷";
    case "clear":
      return "🗑️";
    case "upload":
      return "📁";
    case "reset":
      return "🔄";
    default:
      return "📝";
  }
};

export const getActionDescription = (entry) => {
  switch (entry.type) {
    case "draw":
      return `Drew with ${entry.details.tool} (${entry.details.color})`;
    case "erase":
      return "Erased content";
    case "shape":
      return `Added ${entry.details.tool} shape`;
    case "clear":
      return "Cleared canvas";
    case "upload":
      return `Uploaded image: ${entry.details.fileName}`;
    case "reset":
      return "Reset canvas";
    default:
      return "Unknown action";
  }
};
