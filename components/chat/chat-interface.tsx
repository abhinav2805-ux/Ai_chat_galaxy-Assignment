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
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
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
      conversationId: currentConversationId,
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    },
    onFinish: (msg) => {
      // Handle conversation creation and navigation
      const responseHeaders = msg.headers as any;
      const newConversationId = responseHeaders?.get?.('X-Conversation-Id') || 
                               responseHeaders?.['x-conversation-id'];
      
      if (newConversationId && newConversationId !== currentConversationId) {
        setCurrentConversationId(newConversationId);
        router.push(`/chat/${newConversationId}`);
      }
    },
  })

  useEffect(() => {
    setCurrentConversationId(conversationId);
  }, [conversationId]);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation()
    } else {
      // Clear messages for new chat
      setMessages([])
      setStreamMessages([])
    }
  }, [currentConversationId])

  const loadConversation = async () => {
    if (!currentConversationId) return;
    
    try {
      setIsLoading(true)
      const res = await fetch(`/api/chat/${currentConversationId}`)
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

  // Custom submit handler for file uploads
  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>, formData?: FormData) => {
    e.preventDefault()
    
    if (formData) {
      // Handle file upload with FormData
      try {
        const file = formData.get('file') as File | null
        const prompt = formData.get('prompt') as string
        
        // Add conversationId to formData if available
        if (currentConversationId) {
          formData.append('conversationId', currentConversationId)
        }
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          throw new Error('Failed to send message')
        }
        
        // Check for new conversation ID in headers
        const newConversationId = response.headers.get('X-Conversation-Id')
        if (newConversationId && newConversationId !== currentConversationId) {
          setCurrentConversationId(newConversationId)
          router.push(`/chat/${newConversationId}`)
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
      <Sidebar onNewChat={(conversationId) => {
        setCurrentConversationId(conversationId)
        router.push(`/chat/${conversationId}`)
      }} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <MessageList messages={streamMessages} isLoading={isLoading || isStreaming} onEditMessage={handleEditMessage} />
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={customHandleSubmit}
          isLoading={isStreaming}
          conversationId={currentConversationId}
        />
      </div>
    </div>
  )
}
