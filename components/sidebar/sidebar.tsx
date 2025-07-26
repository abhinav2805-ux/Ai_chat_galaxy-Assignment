"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, Library, Settings, MessageSquare, MoreHorizontal, Edit2, Trash2, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserButton, useUser, useClerk } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"

interface Conversation {
  _id: string
  title?: string
  updatedAt: string
}

export default function Sidebar({ onNewChat }: { onNewChat?: (id: string) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          if (onNewChat) onNewChat(data.id)
          else router.push(`/chat/${data.id}`)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`)
    setSidebarOpen(false)
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Responsive sidebar classes
  const sidebarClass = cn(
    "fixed z-40 top-0 left-0 w-64 bg-muted/30 border-r border-border flex flex-col h-full transition-transform duration-300 lg:static lg:translate-x-0 lg:h-screen",
    sidebarOpen ? "translate-x-0" : "-translate-x-full",
  )

  return (
    <>
      {/* Hamburger for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setSidebarOpen((v) => !v)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={sidebarClass}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">ChatGPT</h1>
            <Button variant="outline" size="sm">
              Get Plus
            </Button>
          </div>

          <Button onClick={handleNewChat} className="w-full justify-start gap-2 bg-transparent" variant="outline" disabled={isLoading}>
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Library className="h-4 w-4" />
            Library
          </Button>
        </div>

        {/* Conversations */}
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Chats</div>
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  onClick={() => handleConversationClick(conversation._id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                {theme === "light" ? <Sun className="h-4 w-4" /> : theme === "dark" ? <Moon className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                Theme
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}> <Sun className="h-4 w-4 mr-2" /> Light </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}> <Moon className="h-4 w-4 mr-2" /> Dark </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}> <Laptop className="h-4 w-4 mr-2" /> System </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile dropdown with logout */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.firstName?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user?.fullName || "User"}</div>
                  <div className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || ""}</div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  onClick: () => void
}

function ConversationItem({ conversation, onClick }: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        isHovered && "bg-muted/50",
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{conversation.title || "New conversation"}</div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity", isHovered && "opacity-100")}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
