"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Check, X, Copy, RotateCcw, FileText, File, Image } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Message {
  id: string
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
  onEdit: (messageId: string, newContent: string) => void
}

export default function MessageBubble({ message, onEdit }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const { toast } = useToast()

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied",
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

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const isUser = message.role === "user"

  return (
    <div className={cn("group flex gap-4 message-enter", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
          AI
        </div>
      )}

      <div className={cn("max-w-[70%] space-y-2", isUser && "order-first")}>
        {/* Attached file preview */}
        {message.attachedFile && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg border",
            isUser ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-border"
          )}>
            {getFileIcon(message.attachedFile.type)}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{message.attachedFile.name}</div>
              <div className="text-xs text-muted-foreground">
                {message.attachedFile.type} {message.attachedFile.size && `• ${(message.attachedFile.size / 1024).toFixed(1)} KB`}
              </div>
            </div>
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 relative",
            isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted text-muted-foreground",
          )}
        >
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>

        {/* Action buttons */}
        <div
          className={cn(
            "flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "justify-end" : "justify-start",
          )}
        >
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2 text-xs">
            <Copy className="h-3 w-3" />
          </Button>
          {isUser && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-6 px-2 text-xs">
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          {!isUser && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          U
        </div>
      )}
    </div>
  )
}
