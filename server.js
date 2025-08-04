const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");
const crypto = require("crypto");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// Store room data with shared history
const rooms = new Map(); // roomId -> { users: Set, canvasData: string, history: Array, historyIndex: number }

// Generate unique room ID
function generateRoomId() {
  return crypto.randomBytes(16).toString("hex");
}

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle joining a room
    socket.on("join-room", (roomId) => {
      console.log(`join-room event received with roomId: ${roomId}`);

      if (!roomId) {
        // Create a new private room
        roomId = generateRoomId();
        console.log(`Creating new room: ${roomId}`);
        socket.emit("room-created", roomId);
      }

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          users: new Set(),
          canvasData: null,
          history: [],
          historyIndex: -1,
        });
      }

      const room = rooms.get(roomId);
      room.users.add(socket.id);
      socket.join(roomId);
      socket.roomId = roomId;

      console.log(
        `User ${socket.id} joined room: ${roomId}. Room users: ${room.users.size}`
      );

      // Send user count to room
      io.to(roomId).emit("user-count", room.users.size);

      // Send existing canvas data to new user if available
      if (room.canvasData) {
        socket.emit("canvas-restored", room.canvasData);
      }

      socket.emit("room-joined", roomId);
    });

    // Handle drawing events (both paths and shapes)
    socket.on("drawing", (data) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit("drawing", data);
      }
    });

    // Handle clear canvas
    socket.on("clear-canvas", () => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          room.canvasData = null; // Clear stored canvas data
        }
        socket.to(socket.roomId).emit("clear-canvas");
      }
    });

    // Handle canvas state save with history management
    socket.on("save-canvas-state", (canvasData) => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          room.canvasData = canvasData;
          // Add to history when new canvas state is saved
          room.history = room.history.slice(0, room.historyIndex + 1);
          room.history.push(canvasData);
          room.historyIndex = room.history.length - 1;
          console.log(`Canvas state saved: room ${socket.roomId}, historyIndex: ${room.historyIndex}, history length: ${room.history.length}`);
        }
      }
    });

    // Handle undo request
    socket.on("undo-request", () => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room && room.historyIndex > 0) {
          room.historyIndex--;
          const canvasData = room.history[room.historyIndex];
          room.canvasData = canvasData;
          console.log(`Undo: room ${socket.roomId}, historyIndex: ${room.historyIndex}, history length: ${room.history.length}`);
          // Broadcast to all users in the room (including the sender)
          io.to(socket.roomId).emit("canvas-restored", canvasData);
        } else {
          console.log(`Undo failed: room ${socket.roomId}, historyIndex: ${room?.historyIndex}, history length: ${room?.history?.length}`);
        }
      }
    });

    // Handle redo request
    socket.on("redo-request", () => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room && room.historyIndex < room.history.length - 1) {
          room.historyIndex++;
          const canvasData = room.history[room.historyIndex];
          room.canvasData = canvasData;
          console.log(`Redo: room ${socket.roomId}, historyIndex: ${room.historyIndex}, history length: ${room.history.length}`);
          // Broadcast to all users in the room (including the sender)
          io.to(socket.roomId).emit("canvas-restored", canvasData);
        } else {
          console.log(`Redo failed: room ${socket.roomId}, historyIndex: ${room?.historyIndex}, history length: ${room?.history?.length}`);
        }
      }
    });

    // Handle canvas restore for undo/redo
    socket.on("canvas-restore", (canvasData) => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          room.canvasData = canvasData;
          // Broadcast to all other users in the room
          socket.to(socket.roomId).emit("canvas-restored", canvasData);
        }
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (socket.roomId) {
        const room = rooms.get(socket.roomId);
        if (room) {
          room.users.delete(socket.id);
          console.log(
            `User ${socket.id} left room: ${socket.roomId}. Room users: ${room.users.size}`
          );

          // Send updated user count to room
          io.to(socket.roomId).emit("user-count", room.users.size);

          // Clean up empty rooms
          if (room.users.size === 0) {
            rooms.delete(socket.roomId);
            console.log(`Room ${socket.roomId} deleted (empty)`);
          }
        }
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log("> Whiteboard app with Socket.io is running!");
    });
});
