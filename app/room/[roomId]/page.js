import Whiteboard from "@/components/WhiteboardNew";

export default function RoomPage({ params }) {
  return (
    <div className="h-screen">
      <Whiteboard roomId={params.roomId} />
    </div>
  );
}
