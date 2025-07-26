import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TypingIndicatorProps {
  message?: string
}

export default function TypingIndicator({ message = "AI is thinking..." }: TypingIndicatorProps) {
  return (
    <div 
      className="flex items-center gap-4 p-4"
      role="status"
      aria-live="polite"
      aria-label="AI is responding"
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src="/placeholder-logo.png" alt="AI" />
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="bg-muted rounded-2xl px-4 py-3 max-w-[200px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2" aria-label="Status message">
          {message}
        </p>
      </div>
    </div>
  )
}
