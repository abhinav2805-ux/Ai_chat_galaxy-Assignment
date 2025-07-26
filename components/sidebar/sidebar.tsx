"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Library, Settings, MessageSquare, MoreHorizontal, Edit2, Trash2, Menu, Check, X, Sun, Moon, Laptop, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserButton, useUser, useClerk } from "@clerk/nextjs"
import { useTheme } from "next-themes"
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
  const [mounted, setMounted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [currentConversationId, setCurrentConversationId] = useState<string>("")
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    fetchConversations()
  }, [])

  // Clean up any redirect_url parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('redirect_url')) {
      // Remove redirect_url parameter and clean the URL
      const url = new URL(window.location.href)
      url.searchParams.delete('redirect_url')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // Set current conversation ID based on URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const match = path.match(/\/chat\/([^\/]+)/)
      if (match) {
        setCurrentConversationId(match[1])
      }
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const handleSignOut = async () => {
    try {
      // Sign out without any redirect parameters
      await signOut()
      
      // Force a clean redirect to landing page
      window.location.replace('/')
    } catch (error) {
      console.error('Sign out error:', error)
      // Fallback: force redirect to landing page
      window.location.replace('/')
    }
  }

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
    setCurrentConversationId(conversationId)
    router.push(`/chat/${conversationId}`)
    // setSidebarOpen(false) // Removed as per edit hint
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

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-muted/30 border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ChatGPT</span>
            <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs">
              Get Plus
            </Button>
          </div>
          <Button className="w-full justify-start gap-2" disabled>
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

  // If user is not authenticated, show a simple loading state
  if (!user) {
    return (
      <div className="flex flex-col h-full bg-muted/30 border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ChatGPT</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Please sign in to continue</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">ChatGPT</span>
          <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs">
            Get Plus
          </Button>
        </div>
        
        <Button 
          onClick={handleNewChat} 
          className="w-full justify-start gap-2"
          aria-label="Start a new conversation"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
        
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2 py-1">Library</h3>
          </div>
          
          <div 
            className="space-y-1"
            role="list"
            aria-label="Conversation history"
          >
            {filteredConversations.map((conversation) => (
              <div
                key={conversation._id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  currentConversationId === conversation._id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted/50"
                )}
                onClick={() => handleConversationClick(conversation._id)}
                role="listitem"
                aria-label={`Conversation: ${conversation.title}`}
                aria-current={currentConversationId === conversation._id ? "page" : undefined}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleConversationClick(conversation._id)
                  }
                }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span className="flex-1 truncate text-sm">{conversation.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteConversation(conversation._id)
                  }}
                  aria-label={`Delete conversation: ${conversation.title}`}
                  title="Delete conversation"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          {filteredConversations.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
              <p>No conversations found matching "{searchQuery}"</p>
            </div>
          )}
          
          {filteredConversations.length === 0 && !searchQuery && (
            <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2"
            aria-label="Open settings"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2"
            onClick={toggleTheme}
            aria-label={`Switch to ${mounted && theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {mounted && theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Theme
          </Button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
              <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.emailAddresses?.[0]?.emailAddress || ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
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
