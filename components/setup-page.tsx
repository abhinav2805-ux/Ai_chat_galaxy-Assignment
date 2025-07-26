"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Key, Database, Bot } from "lucide-react"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">ChatGPT Clone Setup</h1>
          <p className="text-muted-foreground text-lg">Configure your environment variables to get started</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Clerk Authentication
              </CardTitle>
              <CardDescription>Set up user authentication and session management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Required Environment Variables:</p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <div>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</div>
                  <div>CLERK_SECRET_KEY</div>
                </div>
              </div>
              <Button asChild className="w-full">
                <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer">
                  Get Clerk Keys <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Integration
              </CardTitle>
              <CardDescription>Configure AI model for chat responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Required Environment Variables:</p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <div>GOOGLE_GENERATIVE_AI_API_KEY</div>
                </div>
              </div>
              <Button asChild className="w-full">
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                  Get Google AI Key <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database (Optional)
              </CardTitle>
              <CardDescription>Connect MongoDB for conversation persistence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Optional Environment Variables:</p>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <div>MONGODB_URI</div>
                  <div>MEM0_API_KEY</div>
                </div>
              </div>
              <Button variant="outline" asChild className="w-full bg-transparent">
                <a href="https://mongodb.com/atlas" target="_blank" rel="noopener noreferrer">
                  Get MongoDB URI <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>Follow these steps to configure your ChatGPT clone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Create a .env.local file</p>
                  <p className="text-sm text-muted-foreground">
                    In your project root, create a .env.local file with your environment variables
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Add your API keys</p>
                  <p className="text-sm text-muted-foreground">
                    Copy your keys from the respective dashboards and add them to your .env.local file
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Restart your development server</p>
                  <p className="text-sm text-muted-foreground">
                    Run <code className="bg-muted px-1 rounded">npm run dev</code> to restart with new environment
                    variables
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Example .env.local file:</p>
              <pre className="text-xs font-mono">
                {`# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Optional: MongoDB & Memory
MONGODB_URI=mongodb+srv://...
MEM0_API_KEY=mem0_...`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
