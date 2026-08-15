import { HomePage } from "@/components/home/HomePage";

export default async function FeedbackRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <HomePage initialRoomId={roomId} />;
}
