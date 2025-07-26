import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import FileUpload from "@/lib/models/fileUpload.model"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    const webhookSecret = process.env.WEBHOOK_SECRET || "dev-secret"
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileId } = await req.json()
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 })
    }

    await connectToDB()
    const fileDoc = await FileUpload.findById(fileId)
    if (!fileDoc) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Update status to completed since PDF is sent directly to LLM
    fileDoc.processingStatus = 'completed'
    await fileDoc.save()

    console.log(`File ${fileId} marked as completed - PDF sent directly to LLM`)

    return NextResponse.json({ success: true, message: "File processing completed." })
  } catch (error) {
    console.error("[WEBHOOK_PROCESS_FILE]", error)
    
    // Update file status to failed if we have a fileId
    try {
      if (req.body) {
        const { fileId } = await req.json()
        if (fileId) {
          await connectToDB()
          const fileDoc = await FileUpload.findById(fileId)
          if (fileDoc) {
            fileDoc.processingStatus = 'failed'
            await fileDoc.save()
          }
        }
      }
    } catch (updateError) {
      console.error("[WEBHOOK_PROCESS_FILE] Failed to update status:", updateError)
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
