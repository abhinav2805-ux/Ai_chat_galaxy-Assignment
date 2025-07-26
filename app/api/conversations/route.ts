import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import Conversation from "@/lib/models/conversation.model"
import User from "@/lib/models/user.model"
import { createErrorResponse } from "@/lib/api-helpers"

export async function GET() {
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

    const conversations = await Conversation.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(50)

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error)
    return createErrorResponse("Internal Server Error", 500)
  }
}

export async function POST(req: Request) {
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
    const body = await req.json()
    let { title } = body
    if (!title) title = "New Chat"
    const conversation = new Conversation({ userId: user._id, title })
    await conversation.save()
    return NextResponse.json({ id: conversation._id, title: conversation.title })
  } catch (error) {
    console.error("[CONVERSATIONS_POST]", error)
    return createErrorResponse("Internal Server Error", 500)
  }
}

export async function PATCH(req: Request) {
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
    const body = await req.json()
    const { id, title } = body
    if (!id || !title) {
      return createErrorResponse("Missing id or title", 400)
    }
    const conversation = await Conversation.findOne({ _id: id, userId: user._id })
    if (!conversation) {
      return createErrorResponse("Conversation not found", 404)
    }
    conversation.title = title
    await conversation.save()
    return NextResponse.json({ id: conversation._id, title: conversation.title })
  } catch (error) {
    console.error("[CONVERSATIONS_PATCH]", error)
    return createErrorResponse("Internal Server Error", 500)
  }
}
