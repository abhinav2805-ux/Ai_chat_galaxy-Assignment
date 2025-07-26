"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, Library, Settings, MessageSquare, MoreHorizontal, Edit2, Trash2, Menu, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserButton, useUser, useClerk } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const [mounted, setMounted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    fetchConversations()
  }, [])

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [router])

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
        body: JSON.stringify({ title: "New Chat" })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.id) {
          if (onNewChat) onNewChat(data.id)
          else router.push(`/chat/${data.id}`)
        }
      }
    } catch (error) {
      console.error("Failed to create new chat:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConversationClick = (conversationId: string) => {
    router.push(`/chat/${conversationId}`)
    setSidebarOpen(false)
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        // Remove from local state
        setConversations(prev => prev.filter(conv => conv._id !== conversationId))
        // If this was the current conversation, redirect to home
        if (window.location.pathname.includes(conversationId)) {
          router.push('/')
        }
        toast({
          title: "Conversation deleted",
          description: "The conversation has been permanently deleted.",
        })
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      })
      if (res.ok) {
        // Update local state
        setConversations(prev => prev.map(conv => 
          conv._id === conversationId ? { ...conv, title: newTitle } : conv
        ))
        setEditingId(null)
        setEditTitle("")
        toast({
          title: "Conversation renamed",
          description: "The conversation title has been updated.",
        })
      }
    } catch (error) {
      console.error("Failed to rename conversation:", error)
      toast({
        title: "Error",
        description: "Failed to rename conversation. Please try again.",
        variant: "destructive",
      })
    }
  }

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation._id)
    setEditTitle(conversation.title || "")
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const saveEdit = () => {
    if (editTitle.trim()) {
      handleRenameConversation(editingId!, editTitle.trim())
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Responsive sidebar classes
  const sidebarClass = cn(
    "fixed z-50 top-0 left-0 w-80 bg-background border-r border-border flex flex-col h-full transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-screen lg:z-auto",
    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
  )

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className={sidebarClass}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">ChatGPT</h1>
            <Button variant="outline" size="sm">
              Get Plus
            </Button>
          </div>
          <Button className="w-full justify-start gap-2 bg-transparent" variant="outline" disabled>
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hamburger for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border shadow-lg"
        onClick={() => setSidebarOpen((v) => !v)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      {/* Dark overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
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
                  onDelete={handleDeleteConversation}
                  onRename={startEditing}
                  isEditing={editingId === conversation._id}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEditing}
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
              <div className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
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
  onDelete: (conversationId: string) => void
  onRename: (conversation: Conversation) => void
  isEditing: boolean
  editTitle: string
  setEditTitle: (title: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}

function ConversationItem({ 
  conversation, 
  onClick, 
  onDelete, 
  onRename,
  isEditing,
  editTitle,
  setEditTitle,
  onSaveEdit,
  onCancelEdit
}: ConversationItemProps) {
  const isActive = typeof window !== 'undefined' && window.location.pathname.includes(conversation._id)

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveEdit()
            } else if (e.key === 'Escape') {
              onCancelEdit()
            }
          }}
          className="flex-1 text-sm"
          autoFocus
        />
        <Button size="icon" variant="ghost" onClick={onSaveEdit} className="h-6 w-6">
          <Check className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onCancelEdit} className="h-6 w-6">
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        isActive && "bg-muted"
      )}
      onClick={onClick}
    >
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm truncate">{conversation.title || "New Chat"}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRename(conversation)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => onDelete(conversation._id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
