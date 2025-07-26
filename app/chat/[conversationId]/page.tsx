import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ChatInterface from "@/components/chat/chat-interface"

export default async function ChatPage({ params }: { params: { conversationId: string } }) {
  // Check if user is authenticated
  try {
    const { userId } = await auth()
    if (!userId) {
      redirect("/sign-in")
    }
  } catch (error) {
    redirect("/sign-in")
  }

  // Workaround for Next.js dynamic params bug
  const { conversationId } = await Promise.resolve(params);
  return <ChatInterface conversationId={conversationId} />;
}
