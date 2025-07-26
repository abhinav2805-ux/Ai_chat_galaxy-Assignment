"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Mic, Paperclip, X } from "lucide-react"
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
    if (conversationId) formData.append("conversationId", conversationId)
    handleSubmit(e, formData)
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="border-t border-border bg-background p-4" role="region" aria-label="Chat input area">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={customHandleSubmit} className="relative" role="form" aria-label="Send message">
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
                aria-label="Type your message"
                aria-describedby="input-help"
                aria-multiline="true"
                aria-required="false"
              />
              <div id="input-help" className="sr-only">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
            <div className="flex items-center gap-1" role="toolbar" aria-label="Input actions">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-full", isRecording && "bg-red-500 text-white")}
                onClick={() => setIsRecording(!isRecording)}
                aria-label={isRecording ? "Stop recording" : "Start voice recording"}
                aria-pressed={isRecording}
                title={isRecording ? "Stop recording" : "Start voice recording"}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <label className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors" aria-label="Attach file">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="sr-only"
                  accept=".pdf,.docx,.txt,.rtf,.epub"
                  aria-describedby="file-help"
                />
                <div id="file-help" className="sr-only">
                  Supported formats: PDF, DOCX, TXT, RTF, EPUB
                </div>
              </label>
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                aria-describedby={!input.trim() ? "send-disabled-help" : undefined}
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
              {!input.trim() && (
                <div id="send-disabled-help" className="sr-only">
                  Type a message to enable send button
                </div>
              )}
            </div>
          </div>
          
          {/* File preview */}
          {file && (
            <div 
              className="mt-3 p-3 bg-muted/50 rounded-lg border border-border"
              role="region"
              aria-label="Attached file preview"
            >
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {file.type} • {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  aria-label="Remove attached file"
                  title="Remove file"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div 
              className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
              role="status"
              aria-live="polite"
              aria-label="Recording in progress"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600">Recording... Click to stop</span>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div 
              className="mt-3 p-3 bg-muted/50 border border-border rounded-lg flex items-center gap-2"
              role="status"
              aria-live="polite"
              aria-label="AI is processing your message"
            >
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-muted-foreground">AI is thinking...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
