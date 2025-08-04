import { Users, Share2, Plus, Wifi, WifiOff } from "lucide-react";

export default function Header({
  connectedUsers,
  socket,
  roomId,
  onCreateRoom,
}) {
  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200 brand-logo-shadow">
                <span className="text-white font-bold text-xl">✏️</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-sm connection-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold animated-text-gradient">
                Whiteboard
              </h1>
              <p className="text-sm text-gray-600 font-medium tracking-wide">
                Simple Online Collaboaration
              </p>
            </div>
          </div>

          {/* Right Section - Status & Actions & more */}
          <div className="flex items-center gap-4">
            {/* Create Room Button */}
            {!roomId && (
              <button
                onClick={() => {
                  console.log("Header Create Room button clicked");
                  onCreateRoom();
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                Create Room
              </button>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-3">
              {socket?.connected ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200/50 rounded-xl shadow-sm status-badge">
                  <div className="relative">
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm"></div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">
                    Connected
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/50 rounded-xl shadow-sm status-badge">
                  <WifiOff className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">
                    Disconnected
                  </span>
                </div>

              )}

              {/* Users Online */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-sm status-badge">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  {connectedUsers} {connectedUsers === 1 ? "user" : "users"}{" "}
                  online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
