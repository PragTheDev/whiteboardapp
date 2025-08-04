import { Users } from "lucide-react";

export default function Header({ connectedUsers, socket }) {
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">✏️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Collaborative Whiteboard
              </h1>
              <p className="text-sm text-gray-500">
                Draw, share, and create together
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {connectedUsers} user{connectedUsers !== 1 ? "s" : ""} online
              </span>
            </div>

            {socket?.connected ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  Connected
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">
                  Disconnected
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
