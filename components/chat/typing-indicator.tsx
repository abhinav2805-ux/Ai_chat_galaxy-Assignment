export default function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
        AI
      </div>
      <div className="bg-muted rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
          <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
        </div>
      </div>
    </div>
  )
}
