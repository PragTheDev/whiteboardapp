const { createServer } = require("http");
const { Server } = require("socket.io");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

let connectedUsers = 0;

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    connectedUsers++;
    console.log(`User connected: ${socket.id}. Total users: ${connectedUsers}`);

    // Send user count to all clients
    io.emit("user-count", connectedUsers);

    // Handle drawing events (both paths and shapes)
    socket.on("drawing", (data) => {
      socket.broadcast.emit("drawing", data);
    });

    // Handle clear canvas
    socket.on("clear-canvas", () => {
      socket.broadcast.emit("clear-canvas");
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      connectedUsers--;
      console.log(
        `User disconnected: ${socket.id}. Total users: ${connectedUsers}`
      );
      io.emit("user-count", connectedUsers);
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
