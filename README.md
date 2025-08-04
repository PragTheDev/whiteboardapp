# Collaborative Whiteboard

A real-time collaborative whiteboard application built with Next.js and Socket.io. Draw, share, and create together in private rooms with instant synchronization across all connected users.
IMPORTANT: Currently the app doesn't work with real time collaboration in deployment. Currently, it only supports real time collaboration in your local development server.

Video Demo: [Demo](https://drive.google.com/file/d/1rHU3FKEEheYq-v_Oh-OopAaOZVcKxauV/view?usp=sharing)

[ScreenShot](whiteboard.png)

## Features

✨ **Real-time Collaboration** - Multiple users can draw simultaneously with instant synchronization on local environment
🎨 **Drawing Tools** - Pen, eraser, shapes (rectangle, circle, line) with customizable brush sizes  
🎯 **Color Palette** - Multiple colors with easy selection  
🏠 **Private Rooms** - Create private rooms with shareable links  
⚙️ **Canvas Settings** - Customizable background colors and grid overlay  
📱 **Responsive Design** - Works on desktop and mobile devices  
🔄 **Auto-sync** - Canvas state automatically saves and syncs with room members

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Node.js, Socket.io
- **Icons**: Lucide React
- **Styling**: Custom CSS animations and gradients

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/PragTheDev/whiteboardapp.git
cd whiteboardapp
```

2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Create a Room**: Click "Create Room" to start a new collaborative session
2. **Share the Link**: Copy the room URL to invite others to collaborate
3. **Start Drawing**: Use the toolbar to select tools, colors, and brush sizes
4. **Collaborate**: All changes are instantly synchronized with other users in the room

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Room Features

- **Private by Default**: Each room is private with a unique ID
- **Real-time Sync**: Drawing, undo/redo, and canvas changes sync instantly
- **User Count**: See how many users are currently in the room
- **Persistent Canvas**: Canvas state is saved and restored when users join

=
## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Real-time functionality powered by [Socket.io](https://socket.io/)
- Icons by [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)



