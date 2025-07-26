import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from "@clerk/nextjs/server"
import connectToDB from "@/lib/db"
import User from "@/lib/models/user.model"
import Conversation from "@/lib/models/conversation.model"
import Message from "@/lib/models/message.model"
import { saveFile, getFileUrl } from "@/lib/file-storage"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const runtime = 'nodejs';

async function fileToGenerativePart(file: File) {
  const base64EncodedData = Buffer.from(await file.arrayBuffer()).toString('base64');
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
}

export async function POST(req: Request) {
  try {
    console.log("[CHAT_POST] Starting...")
    const { userId: clerkId } = await auth()
    console.log("[CHAT_POST] Clerk ID:", clerkId)
    
    if (!clerkId) {
      console.log("[CHAT_POST] No clerk ID found")
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    await connectToDB()
    console.log("[CHAT_POST] Connected to DB")
    
    let user = await User.findOne({ clerkId })
    console.log("[CHAT_POST] User found:", !!user)
    
    if (!user) {
      console.log("[CHAT_POST] User not found, creating new user")
      try {
        // Create user if not found
        user = new User({ 
          clerkId, 
          email: `${clerkId}@example.com`, // Use unique email based on clerkId
          name: "User" 
        })
        await user.save()
        console.log("[CHAT_POST] New user created:", user._id)
      } catch (error) {
        console.error("[CHAT_POST] Error creating user:", error)
        // If creation fails, try to find the user again (might have been created by another request)
        user = await User.findOne({ clerkId })
        if (!user) {
          return new Response(JSON.stringify({ error: "Failed to create user" }), { status: 500 })
        }
      }
    }

    const contentType = req.headers.get('content-type') || '';
    let prompt = '';
    let file = null;
    let conversationId = '';

    console.log("[CHAT_POST] Content-Type:", contentType)

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await req.formData();
      file = formData.get('file') as File | null;
      prompt = formData.get('prompt') as string;
      conversationId = formData.get('conversationId') as string;
      console.log("[CHAT_POST] FormData - prompt:", prompt, "file:", !!file, "conversationId:", conversationId)
    } else {
      // Handle regular JSON request
      const body = await req.json();
      prompt = body.prompt;
      conversationId = body.conversationId;
      console.log("[CHAT_POST] JSON - prompt:", prompt, "conversationId:", conversationId)
    }

    if (!prompt) {
      console.log("[CHAT_POST] No prompt provided")
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId: user._id });
      console.log("[CHAT_POST] Found existing conversation:", !!conversation)
      if (!conversation) {
        console.log("[CHAT_POST] Conversation not found")
        return new Response(JSON.stringify({ error: "Conversation not found" }), { status: 404 })
      }
    } else {
      // Create new conversation
      console.log("[CHAT_POST] Creating new conversation")
      conversation = new Conversation({ 
        userId: user._id, 
        title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '')
      });
      await conversation.save();
      console.log("[CHAT_POST] New conversation created:", conversation._id)
    }

    // Save user message
    let fileUrl: string | undefined;
    
    if (file) {
      try {
        const savedFilePath = await saveFile(file, conversation._id.toString());
        fileUrl = getFileUrl(savedFilePath);
        console.log("[CHAT_POST] File saved:", fileUrl);
      } catch (error) {
        console.error("[CHAT_POST] Error saving file:", error);
        // Continue without file URL if saving fails
      }
    }

    const userMessage = new Message({
      conversationId: conversation._id,
      content: prompt,
      role: "user",
      attachedFile: file ? {
        name: file.name,
        type: file.type,
        size: file.size,
        url: fileUrl,
      } : undefined,
    });
    await userMessage.save();
    console.log("[CHAT_POST] User message saved")

    // Get conversation history for context
    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: "asc" })
      .limit(20); // Limit to last 20 messages for context

    console.log("[CHAT_POST] Found", messages.length, "previous messages")

    // Prepare conversation history for mem0
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // await memory.add(conversation._id.toString(), {
    //   content: JSON.stringify(conversationHistory),
    //   metadata: {
    //     userId: user._id.toString(),
    //     conversationId: conversation._id.toString(),
    //     title: conversation.title,
    //   }
    // });

    // Prepare parts for Gemini
    let parts: any[] = [{ text: prompt }];

    if (file) {
      console.log("[CHAT_POST] Processing file:", file.name, file.type)
      const filePart = await fileToGenerativePart(file);
      parts = [filePart, { text: prompt }];
    }

    // Add conversation context if available
    if (conversationHistory.length > 1) {
      const contextMessages = conversationHistory.slice(-10); // Last 10 messages for context
      const contextText = contextMessages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      
      parts.unshift({ text: `Previous conversation context:\n${contextText}\n\nCurrent question: ` });
    }

    console.log("[CHAT_POST] Calling Gemini with", parts.length, "parts")
    const result = await model.generateContentStream(parts);
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          
          // Save assistant message after streaming is complete
          const assistantMessage = new Message({
            conversationId: conversation._id,
            content: fullResponse,
            role: "assistant",
          });
          await assistantMessage.save();
          console.log("[CHAT_POST] Assistant message saved")

          // Update conversation with new title if it's the first message
          if (messages.length === 1) {
            conversation.title = prompt.slice(0, 50) + (prompt.length > 50 ? '...' : '');
            await conversation.save();
            console.log("[CHAT_POST] Conversation title updated")
          }

          controller.close();
        } catch (error) {
          console.error("[CHAT_POST] Stream error:", error)
          controller.error(error);
        }
      },
    });

    console.log("[CHAT_POST] Returning stream response")
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Conversation-Id': conversation._id.toString(),
      },
    });
  } catch (error) {
    console.error("[CHAT_POST] Error:", error);
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
