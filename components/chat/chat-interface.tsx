"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar/sidebar"
import MessageList from "@/components/chat/message-list"
import ChatInput from "@/components/chat/chat-input"
import { useChat } from "ai/react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ChatInterfaceProps {
  conversationId?: string
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedTexts, setUploadedTexts] = useState<string[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const {
    messages: streamMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isStreaming,
    setMessages: setStreamMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      conversationId,
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    },
    onFinish: (msg) => {
      if (msg && msg.conversationId && msg.conversationId !== conversationId) {
        router.push(`/chat/${msg.conversationId}`)
      }
    },
  })

  useEffect(() => {
    if (conversationId) {
      loadConversation()
      loadUploadedTexts()
    }
  }, [conversationId])

  const loadConversation = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/chat/${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
        setStreamMessages(data)
      } else {
        setMessages([])
        setStreamMessages([])
      }
    } catch (error) {
      setMessages([])
      setStreamMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debug: Load extractedText from uploaded files
  const loadUploadedTexts = async () => {
    try {
      const res = await fetch(`/api/uploaded-files?conversationId=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setUploadedTexts(data.map((f: any) => f.extractedText).filter(Boolean))
      }
    } catch {}
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const updatedMessages = streamMessages.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent } : msg,
      )
      setStreamMessages(updatedMessages)
      toast({
        title: "Success",
        description: "Message updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message.",
        variant: "destructive",
      })
    }
  }

  const handleFirstMessage = async (message: string) => {
    if (conversationId && message) {
      await fetch(`/api/conversations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: conversationId, title: message.slice(0, 40) })
      })
    }
  }

  // Custom submit handler for file uploads
  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>, formData?: FormData) => {
    e.preventDefault()
    
    if (formData) {
      // Handle file upload with FormData
      try {
        const file = formData.get('file') as File | null
        const prompt = formData.get('prompt') as string
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('Failed to send message')
        }
        
        const reader = response.body?.getReader()
        if (!reader) return
        
        // Create a new message for the user with file info
        const userMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: prompt,
          createdAt: new Date(),
          attachedFile: file ? {
            name: file.name,
            type: file.type,
            size: file.size,
          } : undefined,
        }
        
        setStreamMessages(prev => [...prev, userMessage])
        
        // Stream the response
        let assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        }
        
        setStreamMessages(prev => [...prev, assistantMessage])
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const text = new TextDecoder().decode(value)
          assistantMessage.content += text
          
          setStreamMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: assistantMessage.content }
                : msg
            )
          )
        }
        
        // Clear input
        handleInputChange({ target: { value: '' } } as any)
        
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      // Handle regular text-only messages
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Debug: Show extractedText from uploaded files */}
        {uploadedTexts.length > 0 && (
          <div className="bg-yellow-100 text-black p-2 m-2 rounded text-xs max-h-40 overflow-auto">
            <b>Extracted PDF Text (debug):</b>
            <pre>{uploadedTexts.join("\n---\n").slice(0, 2000)}</pre>
          </div>
        )}
        <MessageList messages={streamMessages} isLoading={isLoading || isStreaming} onEditMessage={handleEditMessage} />
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={customHandleSubmit}
          isLoading={isStreaming}
          conversationId={conversationId}
        />
      </div>
    </div>
  )
}
