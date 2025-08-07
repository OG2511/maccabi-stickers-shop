import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, items, newTotal } = await request.json()

    if (!orderId || !items || typeof newTotal !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Start a transaction by updating the order total first
    const { error: orderError } = await supabase.from("orders").update({ total_price: newTotal }).eq("id", orderId)

    if (orderError) {
      throw orderError
    }

    // Get current order items to know which ones to delete
    const { data: currentItems, error: currentItemsError } = await supabase
      .from("order_items")
      .select("id")
      .eq("order_id", orderId)

    if (currentItemsError) {
      throw currentItemsError
    }

    // Delete all current order items
    if (currentItems && currentItems.length > 0) {
      const { error: deleteError } = await supabase.from("order_items").delete().eq("order_id", orderId)

      if (deleteError) {
        throw deleteError
      }
    }

    // Insert new order items
    if (items.length > 0) {
      const newOrderItems = items.map((item: any) => ({
        order_id: orderId,
        product_id: item.products.id,
        quantity: item.quantity,
        price_per_item: item.price_per_item,
      }))

      const { error: insertError } = await supabase.from("order_items").insert(newOrderItems)

      if (insertError) {
        throw insertError
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
