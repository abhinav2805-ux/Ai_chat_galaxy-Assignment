import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { UserProfile } from "@clerk/nextjs"
import Sidebar from "@/components/sidebar/sidebar"

export default async function ProfilePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <UserProfile
          appearance={{
            elements: {
              card: "bg-card border border-border",
              navbar: "bg-muted",
            },
          }}
        />
      </div>
    </div>
  )
}
