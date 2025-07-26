"use client"

import { useEffect, useRef, useState } from "react"
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
  const [showScrollButton, setShowScrollButton] = useState(false)

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const handleScroll = () => {
    if (!containerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50 // Reduced threshold for better detection
    setShowScrollButton(!isAtBottom)
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive or when typing starts
  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      // Use instant scroll for new messages to avoid jarring animation
      scrollToBottom("instant")
    }
  }, [messages.length, isLoading])

  // Also scroll when messages content changes (for streaming)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.content) {
        // Small delay to ensure content is rendered
        setTimeout(() => scrollToBottom("instant"), 10)
      }
    }
  }, [messages])

  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div className="h-full flex flex-col relative">
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6"
        style={{ scrollBehavior: 'smooth' }}
      >
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
      {showScrollButton && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all duration-200 z-10"
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
