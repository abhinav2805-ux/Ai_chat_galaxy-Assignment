import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import FileUpload from "@/lib/models/fileUpload.model"
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export async function POST(req: Request) {
  console.log("[WEBHOOK_PROCESS_FILE] Route hit")
  try {
    const authHeader = req.headers.get("authorization")
    const webhookSecret = process.env.WEBHOOK_SECRET || "dev-secret"
    console.log("[WEBHOOK_PROCESS_FILE] Auth header:", authHeader?.substring(0, 20) + "...")
    console.log("[WEBHOOK_PROCESS_FILE] Expected secret:", webhookSecret)
    if (authHeader !== `Bearer ${webhookSecret}`) {
      console.log("[WEBHOOK_PROCESS_FILE] Auth failed")
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

    console.log(`[WEBHOOK_PROCESS_FILE] Processing file: ${fileDoc.fileName}`)

    // Update status to processing
    fileDoc.processingStatus = 'processing'
    await fileDoc.save()

    try {
      // For PDF files, we'll extract text using Gemini
      if (fileDoc.fileType === 'application/pdf') {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Fetch the PDF content from Cloudinary
        console.log(`[WEBHOOK_PROCESS_FILE] Fetching PDF from: ${fileDoc.fileUrl}`)
        const pdfResponse = await fetch(fileDoc.fileUrl)
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`)
        }
        
        const pdfBuffer = await pdfResponse.arrayBuffer()
        const base64Data = Buffer.from(pdfBuffer).toString('base64')
        
        // Create a generative part from the PDF content
        const filePart = {
          inlineData: {
            data: base64Data,
            mimeType: fileDoc.fileType,
          },
        };

        // Extract text from the PDF
        const result = await model.generateContent([
          filePart,
          { text: "Please extract and summarize the key content from this document. Focus on the main topics, important information, and any key details that would be useful for answering questions about this document. Return the content in a clear, structured format." }
        ]);

        const extractedText = result.response.text();
        
        // Save the extracted text to the database
        fileDoc.extractedText = extractedText;
        fileDoc.processingStatus = 'completed';
        await fileDoc.save();

        console.log(`[WEBHOOK_PROCESS_FILE] Successfully processed PDF: ${fileDoc.fileName}`);
        console.log(`[WEBHOOK_PROCESS_FILE] Extracted text length: ${extractedText.length} characters`);
      } else {
        // For other file types, mark as completed (they'll be processed directly in chat)
        fileDoc.processingStatus = 'completed';
        await fileDoc.save();
        console.log(`[WEBHOOK_PROCESS_FILE] Marked non-PDF file as completed: ${fileDoc.fileName}`);
      }

      return NextResponse.json({ 
        success: true, 
        message: "File processing completed.",
        extractedText: fileDoc.extractedText 
      })
    } catch (processingError) {
      console.error("[WEBHOOK_PROCESS_FILE] Processing error:", processingError);
      fileDoc.processingStatus = 'failed';
      await fileDoc.save();
      throw processingError;
    }

  } catch (error) {
    console.error("[WEBHOOK_PROCESS_FILE]", error)
    
    // Update file status to failed if we have a fileId
    try {
      const { fileId } = await req.json()
      if (fileId) {
        await connectToDB()
        const fileDoc = await FileUpload.findById(fileId)
        if (fileDoc) {
          fileDoc.processingStatus = 'failed'
          await fileDoc.save()
        }
      }
    } catch (updateError) {
      console.error("[WEBHOOK_PROCESS_FILE] Failed to update status:", updateError)
    }
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
