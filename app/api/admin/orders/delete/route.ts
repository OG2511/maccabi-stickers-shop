import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies()
    const isAuthenticated = cookieStore.get("admin_authenticated")?.value === "true"

    if (!isAuthenticated && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "נדרש אימות מנהל" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    // First delete order items
    const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId)

    if (itemsError) {
      console.error("Error deleting order items:", itemsError)
      return NextResponse.json({ error: "Failed to delete order items" }, { status: 500 })
    }

    // Then delete the order
    const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId)

    if (orderError) {
      console.error("Error deleting order:", orderError)
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete order API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
