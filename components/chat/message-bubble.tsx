"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Edit2, Check, X, Copy, RotateCcw, FileText, File, Image, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface MessageBubbleProps {
  message: Message
  onEdit?: (messageId: string, newContent: string) => void
  isEditing?: boolean // Add editing state prop
  messageIndex?: number
  totalMessages?: number
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />
  if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />
  if (fileType.includes('doc') || fileType.includes('word')) return <FileText className="h-5 w-5" />
  if (fileType.includes('txt')) return <FileText className="h-5 w-5" />
  if (fileType.includes('rtf')) return <FileText className="h-5 w-5" />
  if (fileType.includes('epub')) return <FileText className="h-5 w-5" />
  return <File className="h-5 w-5" />
}

export default function MessageBubble({ message, onEdit, isEditing: globalEditing, messageIndex, totalMessages }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const isUser = message.role === "user"
  const messageRole = isUser ? "user" : "assistant"
  const messageId = `message-${message._id || message.id || messageIndex}`

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
    }
  }, [isEditing])

  const handleEdit = () => {
    // Don't allow editing temporary messages
    if (message._id?.startsWith('temp_') || message.id?.startsWith('temp_')) {
      toast({
        title: "Cannot edit",
        description: "Please wait for the message to be saved before editing.",
        variant: "destructive",
      })
      return
    }

    // Don't allow editing if another edit is in progress
    if (globalEditing) {
      toast({
        title: "Please wait",
        description: "Another edit is in progress. Please wait for it to complete.",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)
    setEditContent(message.content)
  }

  const handleSave = async () => {
    if (editContent.trim() === message.content) {
      setIsEditing(false)
      return
    }

    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty.",
        variant: "destructive",
      })
      return
    }

    if (onEdit) {
      onEdit(message._id || message.id || "", editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditContent(message.content)
  }

  const handleRegenerate = async () => {
    if (!isUser) return
    
    // Don't allow regenerating temporary messages
    if (message._id?.startsWith('temp_') || message.id?.startsWith('temp_')) {
      toast({
        title: "Cannot regenerate",
        description: "Please wait for the message to be saved before regenerating.",
        variant: "destructive",
      })
      return
    }
    
    setIsRegenerating(true)
    try {
      if (onEdit) {
        onEdit(message._id || message.id || "", message.content)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message.",
        variant: "destructive",
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  return (
    <div 
      className={cn("group flex gap-4 message-enter", isUser ? "justify-end" : "justify-start")}
      role="article"
      aria-label={`${messageRole} message ${messageIndex} of ${totalMessages}`}
      id={messageId}
    >
      {!isUser && (
        <Avatar className="h-8 w-8" aria-hidden="true">
          <AvatarImage src="/placeholder-logo.png" alt="AI" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[70%] space-y-2", isUser && "order-first")}>
        {/* Attached file preview */}
        {message.attachedFile && (
          <div 
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2 shadow-sm file-attachment",
              isUser 
                ? "bg-primary/5 border-primary/30 hover:bg-primary/10" 
                : "bg-muted/30 border-border hover:bg-muted/50",
              message.attachedFile.type.includes('pdf') && "file-attachment-pdf",
              message.attachedFile.type.includes('doc') && "file-attachment-doc",
              message.attachedFile.type.startsWith('image/') && "file-attachment-image"
            )}
            role="region"
            aria-label="Attached file"
          >
            <div className={cn(
              "p-2 rounded-lg file-icon",
              message.attachedFile.type.includes('pdf') 
                ? "bg-red-500/10 text-red-600" 
                : message.attachedFile.type.includes('doc')
                ? "bg-blue-500/10 text-blue-600"
                : "bg-green-500/10 text-green-600"
            )}>
              {getFileIcon(message.attachedFile.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-foreground">
                {message.attachedFile.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {message.attachedFile.type.toUpperCase()} 
                {message.attachedFile.size && ` • ${(message.attachedFile.size / 1024).toFixed(1)} KB`}
              </div>
              {message.attachedFile.type.includes('pdf') && (
                <div className="pdf-indicator mt-2">
                  PDF Document
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={() => {
                // For now, just show a toast. In a real app, you'd implement file viewing/downloading
                toast({
                  title: "File Preview",
                  description: `Opening ${message.attachedFile.name}`,
                })
              }}
              aria-label={`View ${message.attachedFile.name}`}
            >
              {message.attachedFile.type.includes('pdf') ? 'View PDF' : 'View File'}
            </Button>
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 relative",
            isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-muted-foreground",
          )}
          role="text"
          aria-label={`${messageRole} message content`}
        >
          {isEditing ? (
            <div className="space-y-2" role="form" aria-label="Edit message">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[100px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                placeholder="Edit your message..."
                aria-label="Edit message text"
              />
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  className="h-8"
                  aria-label="Save edited message"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleCancel} 
                  className="h-8"
                  aria-label="Cancel editing"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap" aria-live="polite">{message.content}</div>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div 
            className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "justify-end" : "justify-start"
            )}
            role="toolbar"
            aria-label="Message actions"
          >
            {isUser && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleEdit}
                  disabled={message._id?.startsWith('temp_') || message.id?.startsWith('temp_') || globalEditing}
                  aria-label={
                    message._id?.startsWith('temp_') || message.id?.startsWith('temp_') 
                      ? "Wait for message to save" 
                      : globalEditing 
                        ? "Another edit in progress" 
                        : "Edit message"
                  }
                  title={
                    message._id?.startsWith('temp_') || message.id?.startsWith('temp_') 
                      ? "Wait for message to save" 
                      : globalEditing 
                        ? "Another edit in progress" 
                        : "Edit message"
                  }
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleRegenerate}
                  disabled={isRegenerating || message._id?.startsWith('temp_') || message.id?.startsWith('temp_') || globalEditing}
                  aria-label={
                    message._id?.startsWith('temp_') || message.id?.startsWith('temp_') 
                      ? "Wait for message to save" 
                      : globalEditing 
                        ? "Another edit in progress" 
                        : "Regenerate response"
                  }
                  title={
                    message._id?.startsWith('temp_') || message.id?.startsWith('temp_') 
                      ? "Wait for message to save" 
                      : globalEditing 
                        ? "Another edit in progress" 
                        : "Regenerate response"
                  }
                >
                  <RotateCcw className={cn("h-3 w-3", isRegenerating && "animate-spin")} />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleCopy}
              aria-label="Copy message to clipboard"
              title="Copy message"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8" aria-hidden="true">
          <AvatarImage src="/placeholder-user.jpg" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
