import { createClient } from "@/lib/supabase/server"

export async function getOrder(orderId: string) {
  const supabase = createClient()

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_per_item,
        products (
          id,
          name,
          price,
          image_url,
          stock,
          collection
        )
      )
    `)
    .eq("id", orderId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch order: ${error.message}`)
  }

  return order
}

export async function getOrders() {
  const supabase = createClient()

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        quantity,
        price_per_item,
        products (
          id,
          name,
          price,
          image_url,
          stock,
          collection
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return orders || []
}

export async function updateOrder(orderId: string, updates: any) {
  const supabase = createClient()

  const { data, error } = await supabase.from("orders").update(updates).eq("id", orderId).select().single()

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }

  return data
}

export async function deleteOrder(orderId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("orders").delete().eq("id", orderId)

  if (error) {
    throw new Error(`Failed to delete order: ${error.message}`)
  }

  return true
}
