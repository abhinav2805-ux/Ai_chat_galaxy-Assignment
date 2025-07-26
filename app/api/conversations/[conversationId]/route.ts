import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import User from "@/lib/models/user.model"
import Conversation from "@/lib/models/conversation.model"
import Message from "@/lib/models/message.model"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDB()
    const user = await User.findOne({ clerkId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { conversationId } = await params
    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId: user._id 
    })
    
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId: conversation._id })
    
    // Delete the conversation
    await Conversation.findByIdAndDelete(conversation._id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CONVERSATION_DELETE]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 