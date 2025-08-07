"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("🔑 Login attempt for:", email)

  if (!email || !password) {
    console.log("🔴 Missing email or password")
    redirect("/login?message=נא למלא את כל השדות")
  }

  const supabase = createClient()

  // Try our custom admin authentication first
  console.log("🔑 Checking custom admin auth...")

  let adminCheck = false
  let adminError = null

  try {
    const result = await supabase.rpc("check_admin_login", {
      email_input: email,
      password_input: password,
    })
    adminCheck = result.data
    adminError = result.error
  } catch (error) {
    console.error("🔴 Error calling check_admin_login:", error)
    adminError = error
  }

  console.log("🔑 Admin check result:", adminCheck, "Error:", adminError?.message)

  if (adminCheck === true) {
    console.log("✅ Custom admin auth successful")

    // Set a simple session cookie for our custom auth
    const cookieStore = cookies()
    cookieStore.set("admin_session", email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    console.log("✅ Admin login successful, redirecting to /admin/orders")
    redirect("/admin/orders")
  }

  // If custom auth fails, try Supabase Auth as fallback
  console.log("🔑 Trying Supabase auth as fallback...")

  let supabaseError = null
  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    supabaseError = result.error
  } catch (error) {
    console.error("🔴 Supabase auth exception:", error)
    supabaseError = error
  }

  if (!supabaseError) {
    console.log("✅ Supabase auth successful")
    redirect("/admin/orders")
  }

  console.error("🔴 Supabase auth error:", supabaseError?.message)
  console.log("🔴 Both auth methods failed")
  redirect("/login?message=שם משתמש או סיסמה שגויים")
}
