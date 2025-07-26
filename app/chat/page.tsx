import Sidebar from "@/components/sidebar/sidebar"

export default function ChatRootPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-semibold mb-4 text-foreground">Start a new chat</h1>
          <p className="text-muted-foreground">Select a conversation or create a new one to begin chatting.</p>
        </div>
      </div>
    </div>
  )
}
