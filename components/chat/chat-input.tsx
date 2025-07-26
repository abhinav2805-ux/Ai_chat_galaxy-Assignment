"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent, ChangeEvent, FormEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Mic, Paperclip, X, MicOff, Volume2 } from "lucide-react"
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
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Voice recording hook - simplified to avoid hydration issues
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support after mount
  useEffect(() => {
    const supported = typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setIsSupported(supported)
  }, [])

  const startRecording = async () => {
    if (!isSupported) {
      setError('Voice recording not supported in this browser')
      return
    }

    try {
      setError(null)
      setIsRecording(true)
      setTranscript('')

      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        console.log('Voice recording started')
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        console.log('Voice recording ended')
        setIsRecording(false)
      }

      recognitionRef.current = recognition
      recognition.start()

    } catch (err) {
      console.error('Failed to start voice recording:', err)
      setError('Failed to start voice recording')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const resetTranscript = () => {
    setTranscript('')
    setError(null)
  }

  // Update input when transcript changes
  useEffect(() => {
    if (transcript && !isRecording) {
      // Update the input with the transcript
      const syntheticEvent = {
        target: { value: transcript }
      } as React.ChangeEvent<HTMLTextAreaElement>
      handleInputChange(syntheticEvent)
    }
  }, [transcript, isRecording, handleInputChange])

  // Show error toast if voice recording fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Voice Recording Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

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
    resetTranscript() // Clear transcript after sending
  }

  const handleVoiceToggle = async () => {
    if (isRecording) {
      stopRecording()
    } else {
      await startRecording()
    }
  }

  const handleClearVoice = () => {
    resetTranscript()
    // Clear the input if it contains the transcript
    if (input === transcript) {
      const syntheticEvent = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLTextAreaElement>
      handleInputChange(syntheticEvent)
    }
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
              {/* Voice Recording Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200 voice-button",
                  isRecording 
                    ? "voice-recording-active recording-pulse" 
                    : "hover:bg-muted"
                )}
                onClick={handleVoiceToggle}
                disabled={!isSupported || isLoading}
                aria-label={
                  isRecording 
                    ? "Stop voice recording" 
                    : "Start voice recording"
                }
                aria-pressed={isRecording}
                title={
                  !isSupported 
                    ? "Voice recording not supported in this browser" 
                    : isRecording 
                      ? "Stop recording" 
                      : "Start recording"
                }
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              {/* Clear Voice Button - only show when there's a transcript */}
              {transcript && !isRecording && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted"
                  onClick={handleClearVoice}
                  aria-label="Clear voice transcript"
                  title="Clear voice transcript"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

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
          
          {/* Voice Recording Status */}
          {isRecording && (
            <div 
              className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2"
              role="status"
              aria-live="polite"
              aria-label="Voice recording in progress"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600">Recording... Click to stop</span>
              {transcript && (
                <div className="flex-1 text-sm text-muted-foreground">
                  "{transcript}"
                </div>
              )}
            </div>
          )}

          {/* Voice Transcript Preview */}
          {transcript && !isRecording && (
            <div 
              className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg transcript-preview transcript-enter"
              role="status"
              aria-live="polite"
              aria-label="Voice transcript ready"
            >
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Voice Transcript</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs ml-auto"
                  onClick={handleClearVoice}
                  aria-label="Clear transcript"
                >
                  Clear
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{transcript}</p>
            </div>
          )}
          
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

          {/* Voice Recording Not Supported */}
          {!isSupported && (
            <div 
              className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
              role="alert"
              aria-label="Voice recording not supported"
            >
              <p className="text-sm text-yellow-600">
                Voice recording is not supported in this browser. Please use Chrome, Edge, or Safari.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
