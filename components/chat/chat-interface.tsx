"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar/sidebar"
import MessageList from "@/components/chat/message-list"
import ChatInput from "@/components/chat/chat-input"
import { useChat } from "ai/react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MessageSquare } from "lucide-react"

interface ChatInterfaceProps {
  conversationId?: string
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // Add editing state
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile sidebar state
  const { toast } = useToast()
  const router = useRouter()

  const {
    messages: streamMessages,
    input,
    handleInputChange,
    handleSubmit, // useChat's default handleSubmit
    isLoading: isStreaming,
    setMessages: setStreamMessages,
  } = useChat({
    api: "/api/chat",
    body: {
      conversationId: currentConversationId, // Use currentConversationId
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    },
    onFinish: (msg) => {
      // This onFinish is for useChat's internal handling, custom streaming is below
      // The X-Conversation-Id header is handled in customHandleSubmit
    },
  })

  useEffect(() => {
    setCurrentConversationId(conversationId); // Update current ID from prop
  }, [conversationId]);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation()
    } else {
      setMessages([]) // Clear messages for new chat
      setStreamMessages([])
    }
  }, [currentConversationId])

  // Close sidebar on mobile when conversation changes
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [currentConversationId])

  const loadConversation = async () => {
    if (!currentConversationId) return;
    try {
      setIsLoading(true)
      const res = await fetch(`/api/chat/${currentConversationId}`) // Fetch messages for current ID
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
        setStreamMessages(data)
      } else {
        console.error("Failed to load conversation")
      }
    } catch (error) {
      console.error("Error loading conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Only allow editing messages with actual MongoDB ObjectIds (not temporary IDs)
    if (messageId.startsWith('temp_')) {
      toast({
        title: "Cannot edit",
        description: "Please wait for the message to be saved before editing.",
        variant: "destructive",
      })
      return
    }

    // Prevent multiple simultaneous edits
    if (isEditing) {
      toast({
        title: "Please wait",
        description: "Another edit is in progress. Please wait for it to complete.",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      if (res.ok) {
        // Update the message in the local state
        setStreamMessages(prev =>
          prev.map(msg =>
            msg._id === messageId
              ? { ...msg, content: newContent }
              : msg
          )
        )
        toast({
          title: "Success",
          description: "Message updated successfully.",
        })
      } else {
        throw new Error('Failed to update message')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>, formData?: FormData) => {
    e.preventDefault()
    
    const prompt = input.trim()
    if (!prompt) return

    // Check if there's a file in the form data
    const file = formData?.get('file') as File
    
    if (file && file.size > 0) {
      // Handle file upload with message
      try {
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)
        uploadFormData.append('conversationId', currentConversationId || '')
        uploadFormData.append('message', prompt)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        const newConversationId = response.headers.get('X-Conversation-Id') // Get new ID from header
        if (newConversationId && newConversationId !== currentConversationId) {
          setCurrentConversationId(newConversationId)
          router.push(`/chat/${newConversationId}`)
        }

        const reader = response.body?.getReader()
        if (!reader) return

        const userMessage = {
          _id: `temp_${Date.now()}`, // Temporary ID for frontend
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

        let assistantMessage = {
          _id: `temp_${Date.now() + 1}`, // Temporary ID for frontend
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
              msg._id === assistantMessage._id
                ? { ...msg, content: assistantMessage.content }
                : msg
            )
          )
        }

        // Clear input
        handleInputChange({ target: { value: '' } } as any)

        // Reload messages to get proper MongoDB ObjectIds
        if (currentConversationId) {
          await loadConversation()
        }

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
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar 
          onNewChat={(conversationId) => { // Pass onNewChat callback
            setCurrentConversationId(conversationId)
            router.push(`/chat/${conversationId}`)
          }}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 w-full lg:w-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Mentora</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <div className="flex-1 overflow-hidden">
          <MessageList 
            messages={streamMessages} 
            isLoading={isLoading || isStreaming || isEditing} 
            onEditMessage={handleEditMessage}
            isEditing={isEditing}
          />
        </div>
        <div className="flex-shrink-0">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={customHandleSubmit} // Use custom submit
            isLoading={isStreaming}
            conversationId={currentConversationId} // Pass current ID
          />
        </div>
      </div>
    </div>
  )
}
