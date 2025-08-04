import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Users, Lock } from "lucide-react";

export default function SharePanel({
  roomId,
  isPrivate = true,
  connectedUsers,
  onCreateRoom,
  showShare,
  setShowShare,
}) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  // Update share URL when roomId changes or component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && roomId) {
      setShareUrl(`${window.location.origin}/room/${roomId}`);
    } else {
      setShareUrl("");
    }
  }, [roomId]);

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createNewRoom = () => {
    onCreateRoom();
  };

  if (!showShare) return null;

  console.log(
    "SharePanel render - roomId:",
    roomId,
    "shareUrl:",
    shareUrl,
    "showShare:",
    showShare
  );

  return (
    <div
      className="fixed top-32 left-6 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80"
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share Whiteboard
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowShare(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </Button>
      </div>

      {!roomId ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Lock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              You're in a private session
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Use the "Create Room" button in the header to start collaborating
            with others
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">
              {connectedUsers} user{connectedUsers !== 1 ? "s" : ""} in this
              room
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Share this link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
              />
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant={copied ? "default" : "outline"}
                className="flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Anyone with this link can join your whiteboard</p>
            <p>• The room will be deleted when everyone leaves</p>
          </div>
        </div>
      )}
    </div>
  );
}
