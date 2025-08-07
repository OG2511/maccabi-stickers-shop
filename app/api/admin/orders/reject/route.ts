import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies()
    const isAuthenticated = cookieStore.get("admin_authenticated")?.value === "true"

    if (!isAuthenticated && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "נדרש אימות מנהל" }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase.from("orders").update({ status: "rejected" }).eq("id", orderId)

    if (error) {
      console.error("Error rejecting order:", error)
      return NextResponse.json({ error: "Failed to reject order" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in reject order API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
