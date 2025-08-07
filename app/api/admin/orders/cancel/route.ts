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

    // Check if order exists and is confirmed
    const { data: order, error: fetchError } = await supabase.from("orders").select("status").eq("id", orderId).single()

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "confirmed") {
      return NextResponse.json({ error: "Only confirmed orders can be cancelled" }, { status: 400 })
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId)

    if (updateError) {
      console.error("Error cancelling order:", updateError)
      return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in cancel order API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
