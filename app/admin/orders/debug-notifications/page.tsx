"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, MessageCircle, AlertTriangle, CheckCircle } from "lucide-react"

export default function DebugNotificationsPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runDiagnostics = async () => {
    setIsChecking(true)
    setResults(null)

    try {
      // Check environment variables
      const envResponse = await fetch("/api/whatsapp/check-env")
      const envData = await envResponse.json()

      // Test WhatsApp API
      const testResponse = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "debug-test-" + Date.now(),
          customerName: "בדיקת מערכת",
          totalPrice: 50,
          paymentMethod: "bit",
          phone: "050-1234567",
        }),
      })

      const testData = await testResponse.json()

      setResults({
        env: envData,
        test: {
          status: testResponse.status,
          data: testData,
          success: testResponse.ok,
        },
        timestamp: new Date().toLocaleString("he-IL"),
      })
    } catch (error) {
      setResults({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toLocaleString("he-IL"),
      })
    }

    setIsChecking(false)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">דיבוג התראות WhatsApp</h1>
        <Button onClick={runDiagnostics} disabled={isChecking}>
          <RefreshCw className={`ml-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
          {isChecking ? "בודק..." : "הרץ בדיקה"}
        </Button>
      </div>

      <div className="space-y-6">
        <Alert>
          <MessageCircle className="h-4 w-4" />
          <AlertDescription>כלי זה בודק את כל הרכיבים הנדרשים לשליחת התראות WhatsApp על הזמנות חדשות.</AlertDescription>
        </Alert>

        {results && (
          <div className="space-y-4">
            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.env?.hasPhone && results.env?.hasApiKey ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  משתני סביבה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>ADMIN_WHATSAPP_NUMBER</span>
                    <Badge variant={results.env?.hasPhone ? "default" : "destructive"}>
                      {results.env?.hasPhone ? "מוגדר ✓" : "חסר ✗"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>CALLMEBOT_API_KEY</span>
                    <Badge variant={results.env?.hasApiKey ? "default" : "destructive"}>
                      {results.env?.hasApiKey ? "מוגדר ✓" : "חסר ✗"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {results.test?.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  בדיקת API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>סטטוס תגובה</span>
                    <Badge variant={results.test?.success ? "default" : "destructive"}>{results.test?.status}</Badge>
                  </div>

                  {results.test?.data && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">פרטי תגובה:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(results.test.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>המלצות לתיקון</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {!results.env?.hasPhone && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>הוסף את משתנה הסביבה ADMIN_WHATSAPP_NUMBER ב-Vercel</span>
                    </div>
                  )}
                  {!results.env?.hasApiKey && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>הוסף את משתנה הסביבה CALLMEBOT_API_KEY ב-Vercel</span>
                    </div>
                  )}
                  {!results.test?.success && results.env?.hasPhone && results.env?.hasApiKey && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span>בדוק שה-API Key תקין ושהמספר רשום ב-CallMeBot</span>
                    </div>
                  )}
                  {results.test?.success && (
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>הכל תקין! ההתראות אמורות לעבוד על הזמנות חדשות</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground">בדיקה אחרונה: {results.timestamp}</div>
          </div>
        )}

        {results?.error && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">שגיאה בבדיקה</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{results.error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
