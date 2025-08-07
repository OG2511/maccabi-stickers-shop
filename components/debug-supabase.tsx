"use client"

import { useEffect, useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugSupabase() {
  const supabase = useSupabase()
  const [clientCount, setClientCount] = useState(0)
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    // ספור כמה פעמים הקומפוננטה נוצרה
    setClientCount((prev) => prev + 1)
  }, [])

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from("products").select("count").limit(1)

      const results = {
        success: !error,
        data,
        error,
        timestamp: new Date().toISOString(),
      }

      setTestResults(results)
      console.log("✅ Supabase connection test:", results)
    } catch (error) {
      const results = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }

      setTestResults(results)
      console.error("❌ Supabase connection error:", error)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>בדיקת Supabase Client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p>
            <strong>מספר יצירות קומפוננטה:</strong> {clientCount}
          </p>
          <p>
            <strong>Client ID:</strong> {supabase ? "קיים" : "לא קיים"}
          </p>
        </div>
        <Button onClick={testConnection}>בדוק חיבור</Button>

        {testResults && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <h4 className="font-medium mb-2">תוצאות בדיקה:</h4>
            <div className="text-xs space-y-1">
              <p>סטטוס: {testResults.success ? "✅ הצליח" : "❌ נכשל"}</p>
              {testResults.error && <p>שגיאה: {JSON.stringify(testResults.error)}</p>}
              <p>זמן: {new Date(testResults.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">בדוק את הקונסול לראות הודעות יצירת client</div>
      </CardContent>
    </Card>
  )
}
