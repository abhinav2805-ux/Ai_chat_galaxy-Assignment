import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ChatInterface from "@/components/chat/chat-interface"
import SetupPage from "@/components/setup-page"

export default async function ChatPage() {
  // Check if Clerk is configured
  const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!hasClerkKeys) {
    return <SetupPage />
  }

  try {
    const { userId } = await auth()

    if (!userId) {
      redirect("/sign-in")
    }

    return <ChatInterface />
  } catch (error) {
    // If auth fails due to missing keys, show setup page
    return <SetupPage />
  }
}
