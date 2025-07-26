"use client"

import { useEffect, useRef } from "react"
import MessageBubble from "./message-bubble"
import TypingIndicator from "./typing-indicator"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"

interface Message {
  _id?: string // MongoDB ObjectId
  id?: string // Fallback for temporary IDs
  role: "user" | "assistant"
  content: string
  createdAt?: string
  attachedFile?: {
    name: string
    type: string
    size?: number
  }
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  onEditMessage: (messageId: string, newContent: string) => void
  isEditing?: boolean // Add global editing state
}

export default function MessageList({ messages, isLoading, onEditMessage, isEditing }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div className="flex-1 relative">
      <div ref={containerRef} className="h-full overflow-y-auto custom-scrollbar px-4 py-6">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h1 className="text-4xl font-semibold mb-4 text-foreground">Where should we begin?</h1>
              <p className="text-muted-foreground">Ask me anything, and I'll do my best to help you.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <MessageBubble 
                key={message._id || message.id || index} 
                message={message} 
                onEdit={onEditMessage} 
                isEditing={isEditing} // Pass the global editing state
              />
            ))}
            {isLoading && <TypingIndicator message={isEditing ? "Regenerating response..." : "AI is thinking..."} />}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-4 right-4 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
        onClick={scrollToBottom}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
