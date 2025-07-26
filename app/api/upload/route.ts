import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { v2 as cloudinary } from "cloudinary"
import FileUpload from "@/lib/models/fileUpload.model"
import { Readable } from "stream"
import connectToDB from "@/lib/db"
import User from "@/lib/models/user.model"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function bufferToStream(buffer: Buffer) {
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

export async function POST(req: Request) {
  try {
    const authResult = await auth()
    const clerkId =
      authResult && typeof authResult === "object" && "userId" in authResult ? authResult.userId : undefined

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDB()
    let user = await User.findOne({ clerkId })
    if (!user) {
      const claims = (authResult.sessionClaims as Record<string, any>) || {}
      const email = claims.email || claims.email_address || claims.primaryEmail || claims.primary_email_address || ""
      const name = claims.name || claims.fullName || ""
      const picture = claims.picture || claims.imageUrl || ""

      if (!email) {
        return NextResponse.json(
          { error: "No email found in Clerk session claims. Cannot create user." },
          { status: 400 },
        )
      }

      user = await User.create({ clerkId, email, name, picture })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    console.log('file:', file, 'type:', typeof file, 'constructor:', file?.constructor?.name);
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: "No file provided or file is a path string. Please upload a real file." }, { status: 400 })
    }
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    console.log('file type:', file.type, 'fileBuffer length:', fileBuffer.length);

    // Upload to Cloudinary
    const cloudinaryUploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "auto" }, (error, result) => {
          if (error) reject(error)
          resolve(result)
        })
        .end(fileBuffer)
    })

    const conversationId = formData.get("conversationId") as string | null
    
    // Save file metadata to DB (without extractedText)
    const newFileUpload = new FileUpload({
      userId: user._id,
      fileName: file.name,
      fileUrl: cloudinaryUploadResult.secure_url,
      fileType: file.type,
      conversationId: conversationId || undefined,
      processingStatus: 'pending',
      // extractedText will be populated by the background webhook
    })
    await newFileUpload.save();
    console.log("[UPLOAD] FileUpload metadata saved:", newFileUpload);

    // Trigger the background processing webhook (without await for immediate response)
    const baseUrl = req.headers.get('origin') || `http://${req.headers.get('host')}`
    const webhookSecret = process.env.WEBHOOK_SECRET || "dev-secret"
    fetch(`${baseUrl}/api/webhook/process-file`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${webhookSecret}`,
        },
        body: JSON.stringify({ fileId: newFileUpload._id }),
    }).catch(error => {
        console.error("[UPLOAD] Failed to trigger webhook:", error);
    });

    return NextResponse.json(
      {
        message: "File uploaded and processing started.",
        file: newFileUpload,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[UPLOAD_POST]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
