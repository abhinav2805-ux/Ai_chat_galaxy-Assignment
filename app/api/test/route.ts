import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  try {
    console.log("[TEST_GET] Starting...")
    const { userId: clerkId } = await auth()
    console.log("[TEST_GET] Clerk ID:", clerkId)
    
    return NextResponse.json({ 
      message: "API is working", 
      clerkId: clerkId || "No clerk ID",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[TEST_GET] Error:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("[TEST_POST] Starting...")
    const { userId: clerkId } = await auth()
    console.log("[TEST_POST] Clerk ID:", clerkId)
    
    return NextResponse.json({ 
      message: "POST is working", 
      clerkId: clerkId || "No clerk ID",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[TEST_POST] Error:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
} 