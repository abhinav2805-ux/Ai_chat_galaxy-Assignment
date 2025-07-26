import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import User from "@/lib/models/user.model"
import FileUpload from "@/lib/models/fileUpload.model"

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    await connectToDB()
    const user = await User.findOne({ clerkId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const files = await FileUpload.find({ 
      conversationId, 
      userId: user._id 
    }).select('fileName fileType processingStatus extractedText createdAt')

    return NextResponse.json({ files })
  } catch (error) {
    console.error("[UPLOADED_FILES_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 