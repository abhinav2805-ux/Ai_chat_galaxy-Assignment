"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Mic, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ChatInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, formData?: FormData) => void
  isLoading: boolean
  conversationId?: string
}

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  conversationId,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        customHandleSubmit(e as any)
      }
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px"
    }
  }

  const handleInputChangeWithResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    adjustTextareaHeight()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const customHandleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("prompt", input)
    if (file) formData.append("file", file)
    handleSubmit(e, formData)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={customHandleSubmit} className="relative">
          <div className="flex items-end gap-2 bg-muted rounded-2xl p-3">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChangeWithResize}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                className="min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60"
                rows={1}
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-full", isRecording && "bg-red-500 text-white")}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <label className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.rtf,.epub"
                />
              </label>
              <Button type="submit" size="icon" className="h-8 w-8 rounded-full" disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {file && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
              <span>Attached: {file.name}</span>
              <Button type="button" size="icon" variant="ghost" className="h-4 w-4" onClick={() => setFile(null)}>
                ×
              </Button>
            </div>
          )}
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
