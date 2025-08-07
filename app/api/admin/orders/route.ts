import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = cookies()
    const isAuthenticated = cookieStore.get("admin_authenticated")?.value === "true"

    console.log("🔐 Admin auth check:", {
      isAuthenticated,
      nodeEnv: process.env.NODE_ENV,
      cookieValue: cookieStore.get("admin_authenticated")?.value,
    })

    if (!isAuthenticated && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "נדרש אימות מנהל" }, { status: 401 })
    }

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
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    return NextResponse.json(orders || [])
  } catch (error) {
    console.error("Error in orders API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  try {
    const {
      customer_name,
      customer_phone,
      payment_method,
      delivery_method = "pickup",
      city,
      street,
      house_number,
      zip_code,
      items,
      total_amount,
      session_id,
    } = body;

    if (!customer_name || !customer_phone || !payment_method || !items || !session_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check stock availability
    await validateOrderAgainstStock(items);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        customer_name,
        customer_phone,
        payment_method,
        delivery_method,
        city,
        street,
        house_number,
        zip_code,
        items,
        total_amount,
        session_id,
        shipping_cost: delivery_method === "delivery" ? 15 : 0,
        status: "pending",
      }]);

    if (orderError) throw orderError;

    const order_id = order?.[0]?.id;
    const orderItems = items.map((item: any) => ({
      order_id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_per_item: item.product.price,
      unit_price: item.product.price,
      discounted_price: item.discounted_price,
      total_price: item.total_price,
      discount_percentage: item.discount_percentage || 0,
    }));

    const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);
    if (orderItemsError) throw orderItemsError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
