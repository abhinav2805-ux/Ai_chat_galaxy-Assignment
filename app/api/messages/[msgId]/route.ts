import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import User from "@/lib/models/user.model"
import Message from "@/lib/models/message.model"
import Conversation from "@/lib/models/conversation.model"
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ msgId: string }> }
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

    const { msgId } = await params
    const { content } = await req.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Find the message and verify ownership
    const message = await Message.findById(msgId)
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Verify the conversation belongs to the user
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      userId: user._id
    })
    if (!conversation) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update the message content
    message.content = content.trim()
    await message.save()

    // Delete all messages that come after this message (to regenerate the conversation)
    await Message.deleteMany({
      conversationId: message.conversationId,
      createdAt: { $gt: message.createdAt }
    })

    // Get conversation history up to this message
    const messages = await Message.find({
      conversationId: message.conversationId,
      createdAt: { $lte: message.createdAt }
    }).sort({ createdAt: "asc" })

    // Prepare conversation history for AI
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }))

    // Generate new AI response
    let parts: any[] = [{ text: content }]

    if (conversationHistory.length > 1) {
      const contextMessages = conversationHistory.slice(-10)
      const contextText = contextMessages.map(msg =>
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')
      parts.unshift({ text: `Previous conversation context:\n${contextText}\n\nCurrent question: ` })
    }

    const result = await model.generateContentStream(parts)

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullResponse += text
            controller.enqueue(new TextEncoder().encode(text))
          }
        }

        // Save the new assistant response
        const assistantMessage = new Message({
          conversationId: message.conversationId,
          content: fullResponse,
          role: "assistant",
        })
        await assistantMessage.save()

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })

  } catch (error) {
    console.error("[MESSAGE_PATCH]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
