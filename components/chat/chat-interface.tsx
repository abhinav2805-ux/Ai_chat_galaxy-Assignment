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
  const [isEditing, setIsEditing] = useState(false) // Add editing state
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
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
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to edit message')
      }

      // Update the edited message in the UI immediately
      setStreamMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, content: newContent } : msg
      ))

      // Create a temporary assistant message for streaming
      const tempAssistantMessage = {
        _id: `temp_assistant_${Date.now()}`,
        role: 'assistant' as const,
        content: '',
        createdAt: new Date(),
      }

      // Add the temporary assistant message to the UI
      setStreamMessages(prev => [...prev, tempAssistantMessage])

      // Stream the AI response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        tempAssistantMessage.content += text

        // Update the streaming message in the UI
        setStreamMessages(prev =>
          prev.map(msg =>
            msg._id === tempAssistantMessage._id
              ? { ...msg, content: tempAssistantMessage.content }
              : msg
          )
        )
      }

      // Reload the conversation to get the proper MongoDB ObjectIds
      await loadConversation()

      toast({
        title: "Message updated",
        description: "The message has been updated and the conversation regenerated.",
      })
    } catch (error) {
      console.error("Error editing message:", error)
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  // Custom submit handler for file uploads and streaming
  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>, formData?: FormData) => {
    e.preventDefault()

    if (formData) {
      try {
        const file = formData.get('file') as File | null
        const prompt = formData.get('prompt') as string

        if (currentConversationId) {
          formData.append('conversationId', currentConversationId) // Add conversationId to FormData
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          body: formData,
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
      <Sidebar onNewChat={(conversationId) => { // Pass onNewChat callback
        setCurrentConversationId(conversationId)
        router.push(`/chat/${conversationId}`)
      }} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <MessageList 
          messages={streamMessages} 
          isLoading={isLoading || isStreaming || isEditing} 
          onEditMessage={handleEditMessage}
          isEditing={isEditing}
        />
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={customHandleSubmit} // Use custom submit
          isLoading={isStreaming}
          conversationId={currentConversationId} // Pass current ID
        />
      </div>
    </div>
  )
}
