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

    // 1. Fetch order items with current product stock
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("quantity, products(id, stock)")
      .eq("order_id", orderId)

    if (itemsError || !items) {
      return NextResponse.json({ error: "Could not fetch order items." }, { status: 500 })
    }

    // 2. Validate stock availability before confirming
    for (const item of items) {
      if (item.products) {
        if (item.products.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `אין מספיק במלאי עבור מוצר ${item.products.id}. יש במלאי רק ${item.products.stock} יחידות.`,
            },
            { status: 400 },
          )
        }
      }
    }

    // 3. Update stock for each product
    for (const item of items) {
      if (item.products) {
        const newStock = item.products.stock - item.quantity
        const { error: stockError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.products.id)

        if (stockError) {
          return NextResponse.json({ error: `Failed to update stock for product ${item.products.id}` }, { status: 500 })
        }
      }
    }

    // 4. Update order status
    const { error: orderError } = await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId)

    if (orderError) {
      return NextResponse.json({ error: "Failed to update order status." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error confirming order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
