"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Helper function to check admin authentication
async function checkAdminAuth() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get("admin_session")

  if (adminSession) {
    console.log("🔑 Admin session verified:", adminSession.value)
    return true
  }

  // Fallback to Supabase auth
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    console.log("🔑 Supabase user verified:", user.id)
    return true
  }

  console.log("🔑 No valid authentication found")
  return false
}

export async function addProduct(formData: FormData) {
  console.log("🔵 Starting addProduct action")

  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    return { success: false, error: "Authentication required" }
  }

  const supabase = createClient()

  const productData = {
    name: formData.get("name") as string,
    price: Number.parseFloat(formData.get("price") as string),
    collection: formData.get("collection") as string,
    stock: Number.parseInt(formData.get("stock") as string),
    image_url: (formData.get("image_url") as string) || null,
  }

  console.log("🔵 Product data:", productData)

  const { error } = await supabase.from("products").insert(productData)

  if (error) {
    console.error("🔴 Supabase insert error:", error)
    return { success: false, error: `Failed to add product: ${error.message}` }
  }

  console.log("✅ Product added successfully")

  // Force revalidation of all product-related pages
  revalidatePath("/admin/products", "page")
  revalidatePath("/shop", "page")
  revalidatePath("/", "page")

  // Also try to revalidate the layout to ensure header updates
  revalidatePath("/", "layout")

  return { success: true }
}

export async function updateProduct(formData: FormData) {
  console.log("🟡 Starting updateProduct action")

  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    return { success: false, error: "Authentication required" }
  }

  const supabase = createClient()

  const productId = formData.get("id") as string
  const productData = {
    name: formData.get("name") as string,
    price: Number.parseFloat(formData.get("price") as string),
    collection: formData.get("collection") as string,
    stock: Number.parseInt(formData.get("stock") as string),
    image_url: (formData.get("image_url") as string) || null,
  }

  console.log("🟡 Updating product ID:", productId)
  console.log("🟡 Product data:", productData)

  const { error } = await supabase.from("products").update(productData).eq("id", productId)

  if (error) {
    console.error("🔴 Supabase update error:", error)
    return { success: false, error: `Failed to update product: ${error.message}` }
  }

  console.log("✅ Product updated successfully")

  // Force revalidation of all product-related pages
  revalidatePath("/admin/products", "page")
  revalidatePath("/shop", "page")
  revalidatePath("/", "page")

  // Also try to revalidate the layout to ensure header updates
  revalidatePath("/", "layout")

  return { success: true }
}

export async function deleteProductAction(formData: FormData) {
  const productId = formData.get("productId") as string
  console.log("🔴 Starting deleteProductAction for ID:", productId)

  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    return { success: false, error: "Authentication required" }
  }

  const supabase = createClient()

  console.log("🔴 Attempting to delete product with ID:", productId)

  const { error: deleteError, data: deleteResult } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .select()

  if (deleteError) {
    console.error("🔴 Supabase delete error:", deleteError)
    console.error("🔴 Delete error details:", {
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
      code: deleteError.code,
    })
    return { success: false, error: "Failed to delete product" }
  }

  console.log("✅ Delete operation completed")
  console.log("🔴 Delete result:", deleteResult)

  // Add a small delay to ensure the deletion is fully processed
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Force revalidation of all product-related pages
  revalidatePath("/admin/products", "page")
  revalidatePath("/shop", "page")
  revalidatePath("/", "page")

  // Also try to revalidate the layout to ensure header updates
  revalidatePath("/", "layout")

  return { success: true }
}

// New action to reject an order
export async function rejectOrder(orderId: string) {
  const isAuthenticated = await checkAdminAuth()
  if (!isAuthenticated) {
    return { success: false, error: "Authentication required" }
  }

  const supabase = createClient()

  const { error } = await supabase.from("orders").update({ status: "rejected" }).eq("id", orderId)

  if (error) {
    console.error("🔴 Error rejecting order:", error)
    return { success: false, error: "Failed to reject order" }
  }

  revalidatePath("/admin/orders")
  return { success: true }
}
