"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadButtonProps {
  conversationId?: string
}

export default function FileUploadButton({ conversationId }: FileUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)
        if (conversationId) {
          formData.append("conversationId", conversationId)
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setUploadedFiles((prev) => [...prev, file.name])
          toast({
            title: "Success",
            description: `${file.name} uploaded successfully.`,
          })
        } else {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file(s).",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((name) => name !== fileName))
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={handleFileSelect}
        disabled={isUploading}
      >
        {isUploading ? <Upload className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {uploadedFiles.map((fileName, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
            >
              <span className="truncate max-w-20">{fileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0"
                onClick={() => removeFile(fileName)}
              >
                <X className="h-2 w-2" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
