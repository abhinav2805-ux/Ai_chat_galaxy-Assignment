import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import Conversation from "@/lib/models/conversation.model"
import User from "@/lib/models/user.model"
import { createErrorResponse } from "@/lib/api-helpers"

export async function GET() {
  try {
    console.log("[CONVERSATIONS_GET] Starting...")
    const { userId: clerkId } = await auth()
    console.log("[CONVERSATIONS_GET] Clerk ID:", clerkId)
    
    if (!clerkId) {
      console.log("[CONVERSATIONS_GET] No clerk ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDB()
    console.log("[CONVERSATIONS_GET] Connected to DB")
    
    let user = await User.findOne({ clerkId })
    console.log("[CONVERSATIONS_GET] User found:", !!user)
    
    if (!user) {
      console.log("[CONVERSATIONS_GET] User not found, creating new user")
      try {
        // Create user if not found
        user = new User({ 
          clerkId, 
          email: `${clerkId}@example.com`, // Use unique email based on clerkId
          name: "User" 
        })
        await user.save()
        console.log("[CONVERSATIONS_GET] New user created:", user._id)
      } catch (error) {
        console.error("[CONVERSATIONS_GET] Error creating user:", error)
        // If creation fails, try to find the user again (might have been created by another request)
        user = await User.findOne({ clerkId })
        if (!user) {
          return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
        }
      }
    }

    const conversations = await Conversation.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(50)
    console.log("[CONVERSATIONS_GET] Found conversations:", conversations.length)

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[CONVERSATIONS_GET] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    console.log("[CONVERSATIONS_POST] Starting...")
    const { userId: clerkId } = await auth()
    console.log("[CONVERSATIONS_POST] Clerk ID:", clerkId)
    
    if (!clerkId) {
      console.log("[CONVERSATIONS_POST] No clerk ID found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    await connectToDB()
    console.log("[CONVERSATIONS_POST] Connected to DB")
    
    let user = await User.findOne({ clerkId })
    console.log("[CONVERSATIONS_POST] User found:", !!user)
    
    if (!user) {
      console.log("[CONVERSATIONS_POST] User not found, creating new user")
      try {
        // Create user if not found
        user = new User({ 
          clerkId, 
          email: `${clerkId}@example.com`, // Use unique email based on clerkId
          name: "User" 
        })
        await user.save()
        console.log("[CONVERSATIONS_POST] New user created:", user._id)
      } catch (error) {
        console.error("[CONVERSATIONS_POST] Error creating user:", error)
        // If creation fails, try to find the user again (might have been created by another request)
        user = await User.findOne({ clerkId })
        if (!user) {
          return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
        }
      }
    }
    
    const body = await req.json()
    let { title } = body
    if (!title) title = "New Chat"
    
    console.log("[CONVERSATIONS_POST] Creating conversation with title:", title)
    const conversation = new Conversation({ userId: user._id, title })
    await conversation.save()
    console.log("[CONVERSATIONS_POST] Conversation created:", conversation._id)
    
    return NextResponse.json({ id: conversation._id, title: conversation.title })
  } catch (error) {
    console.error("[CONVERSATIONS_POST] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
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
