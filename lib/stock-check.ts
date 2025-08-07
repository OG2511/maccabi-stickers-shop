import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function checkStockAvailability(productId: string, requestedQty: number): Promise<boolean> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single()

  if (productError || !product) return false

  const { data: reservations } = await supabase
    .from("stock_reservations")
    .select("quantity")
    .eq("product_id", productId)
    .gt("expires_at", new Date().toISOString())

  const reservedQty = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0
  const available = product.stock - reservedQty

  return available >= requestedQty
}
