import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import Conversation from "@/lib/models/conversation.model"
import Message from "@/lib/models/message.model"
import User from "@/lib/models/user.model"
import { createErrorResponse } from "@/lib/api-helpers"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  // Await params and destructure conversationId for Next.js 15 compatibility
  const { conversationId } = await params;

  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return createErrorResponse("Unauthorized", 401)
    }

    await connectToDB()
    const user = await User.findOne({ clerkId })
    if (!user) {
      return createErrorResponse("User not found", 404)
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: user._id,
    })

    if (!conversation) {
      return createErrorResponse("Conversation not found or access denied", 404)
    }

    const messages = await Message.find({
      conversationId: conversationId,
    }).sort({ createdAt: "asc" })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("[CONVERSATION_GET]", error)
    return createErrorResponse("Internal Server Error", 500)
  }
}
