import ChatInterface from "@/components/chat/chat-interface";

export default async function ChatPage({ params }: { params: { conversationId: string } }) {
  // Workaround for Next.js dynamic params bug
  const { conversationId } = await Promise.resolve(params);
  return <ChatInterface conversationId={conversationId} />;
}
