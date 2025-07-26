import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import Message from "@/lib/models/message.model"
import User from "@/lib/models/user.model"
import { createErrorResponse } from "@/lib/api-helpers"

export async function PUT(req: Request, { params }: { params: { msgId: string } }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return createErrorResponse("Unauthorized", 401)
    }

    const { content } = await req.json()
    if (!content) {
      return createErrorResponse("Content is required", 400)
    }

    await connectToDB()
    const user = await User.findOne({ clerkId })
    if (!user) {
      return createErrorResponse("User not found", 404)
    }

    const message = await Message.findById(params.msgId).populate("conversationId")
    if (!message) {
      return createErrorResponse("Message not found", 404)
    }

    // Check if the user owns the conversation this message belongs to
    const conversation = message.conversationId as any
    if (conversation.userId.toString() !== user._id.toString()) {
      return createErrorResponse("Access denied", 403)
    }

    // Business logic: Only allow users to edit their own messages
    if (message.role !== "user") {
      return createErrorResponse("Cannot edit an assistant's message", 403)
    }

    message.content = content
    await message.save()

    return NextResponse.json(message)
  } catch (error) {
    console.error("[MESSAGE_PUT]", error)
    return createErrorResponse("Internal Server Error", 500)
  }
}
