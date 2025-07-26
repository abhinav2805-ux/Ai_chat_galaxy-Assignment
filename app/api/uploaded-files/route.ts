import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import FileUpload from "@/lib/models/fileUpload.model"
import User from "@/lib/models/user.model"

export async function GET(req: Request) {
  try {
    const authResult = await auth()
    const clerkId =
      authResult && typeof authResult === "object" && "userId" in authResult ? authResult.userId : undefined

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDB()
    const user = await User.findOne({ clerkId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get('fileId')
    const conversationId = searchParams.get('conversationId')

    if (fileId) {
      // Get specific file
      const file = await FileUpload.findOne({ _id: fileId, userId: user._id })
      if (!file) {
        return NextResponse.json({ error: "File not found" }, { status: 404 })
      }
      return NextResponse.json({ file })
    } else if (conversationId) {
      // Get all files for a conversation
      const files = await FileUpload.find({ 
        conversationId, 
        userId: user._id 
      }).sort({ createdAt: -1 })
      return NextResponse.json({ files })
    } else {
      // Get all files for the user
      const files = await FileUpload.find({ 
        userId: user._id 
      }).sort({ createdAt: -1 })
      return NextResponse.json({ files })
    }
  } catch (error) {
    console.error("[UPLOADED_FILES_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
} 