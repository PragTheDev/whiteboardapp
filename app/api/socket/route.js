import { Server } from 'socket.io';

let io;

export async function GET(req) {
  if (!global.io) {
    console.log('Setting up Socket.io server...');
    
    // Create a new Server instance
    global.io = new Server({
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    global.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle drawing events
      socket.on('drawing', (data) => {
        socket.broadcast.emit('drawing', data);
      });

      // Handle clear canvas
      socket.on('clear-canvas', () => {
        socket.broadcast.emit('clear-canvas');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  return new Response('Socket.io server is running', { status: 200 });
}
