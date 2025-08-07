import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

// יצירת סינגלטון עבור Supabase client בצד השרת
let supabaseServerClient: any = null

function getSupabaseClient() {
  if (supabaseServerClient) {
    return supabaseServerClient
  }

  // בדיקה שמשתני הסביבה קיימים
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables")
  }

  // יצירת מופע חדש רק אם אין כבר אחד
  supabaseServerClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  )

  console.log("🔧 Server Supabase client created (singleton)")
  return supabaseServerClient
}

export async function GET() {
  return NextResponse.json({
    hasPhone: !!process.env.ADMIN_WHATSAPP_NUMBER,
    hasApiKey: !!process.env.CALLMEBOT_API_KEY,
  })
}
