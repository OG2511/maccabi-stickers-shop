import type React from "react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // הגנה מועברת ל-middleware, אז כאן אנחנו יכולים להיות בטוחים שהמשתמש מחובר
  return <>{children}</>
}
