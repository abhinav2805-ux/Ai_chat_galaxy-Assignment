import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import FileUpload from "@/lib/models/fileUpload.model"
import pdf from "pdf-parse"

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

    // Update status to processing
    fileDoc.processingStatus = 'processing'
    await fileDoc.save()

    console.log(`Processing file: ${fileDoc.fileUrl}`)
    const response = await fetch(fileDoc.fileUrl)
    const fileBuffer = await response.arrayBuffer()

    const data = await pdf(Buffer.from(fileBuffer))
    const extractedText = data.text

    console.log(`Extracted ${extractedText.length} characters.`)

    fileDoc.extractedText = extractedText
    fileDoc.processingStatus = 'completed'
    await fileDoc.save()

    return NextResponse.json({ success: true, message: "File processed." })
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
