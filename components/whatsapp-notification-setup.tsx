"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { MessageCircle, ExternalLink, Copy, AlertTriangle, CheckCircle, Settings, Server } from "lucide-react"

export function WhatsAppNotificationSetup() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isTestingCallMeBot, setIsTestingCallMeBot] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [envStatus, setEnvStatus] = useState<{ hasPhone: boolean; hasApiKey: boolean } | null>(null)
  const { toast } = useToast()

  // Check environment variables status
  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/whatsapp/check-env")
        const data = await response.json()
        setEnvStatus(data)
      } catch (error) {
        console.error("Error checking env vars:", error)
      }
    }
    checkEnvVars()
  }, [])

  const testCallMeBotNotification = async () => {
    if (!phoneNumber || !apiKey) {
      toast({
        title: "שגיאה",
        description: "נא למלא מספר טלפון ו-API Key",
        variant: "destructive",
      })
      return
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, "")
    if (!cleanPhone.startsWith("+")) {
      toast({
        title: "שגיאה בפורמט טלפון",
        description: "מספר הטלפון חייב להתחיל ב-+ (לדוגמה: +972501234567)",
        variant: "destructive",
      })
      return
    }

    setIsTestingCallMeBot(true)
    setDebugInfo("מתחיל בדיקה...")

    try {
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: "test-" + Date.now(),
          customerName: "בדיקה",
          totalPrice: 100,
          paymentMethod: "bit",
          phone: "050-1234567",
          testPhone: cleanPhone,
          testApiKey: apiKey,
        }),
      })

      const result = await response.json()

      setDebugInfo(`
סטטוס תגובה: ${response.status}
תוכן התגובה: ${JSON.stringify(result, null, 2)}
      `)

      if (response.ok && result.success) {
        toast({
          title: "הודעת בדיקה נשלחה!",
          description: "בדוק את הווטסאפ שלך תוך 1-2 דקות",
        })
      } else {
        toast({
          title: "שגיאה בשליחה",
          description: result.error || "שגיאה לא ידועה",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setDebugInfo(`שגיאה: ${error}`)
      toast({
        title: "שגיאה בשליחה",
        description: "בדוק את הגדרות ה-API ומספר הטלפון",
        variant: "destructive",
      })
    }

    setIsTestingCallMeBot(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "הועתק!", description: "הטקסט הועתק ללוח" })
  }

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, "")
    if (!cleanPhone.startsWith("+")) return false
    if (cleanPhone.length < 10) return false
    return true
  }

  const validateApiKey = (key: string) => {
    return key.length > 0 && /^\d+$/.test(key)
  }

  return (
    <div className="space-y-6">
      {/* Environment Variables Status */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Server className="h-5 w-5" />
            סטטוס משתני סביבה
          </CardTitle>
        </CardHeader>
        <CardContent>
          {envStatus ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {envStatus.hasPhone ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={envStatus.hasPhone ? "text-green-700" : "text-red-700"}>
                  ADMIN_WHATSAPP_NUMBER: {envStatus.hasPhone ? "מוגדר ✓" : "לא מוגדר ✗"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {envStatus.hasApiKey ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={envStatus.hasApiKey ? "text-green-700" : "text-red-700"}>
                  CALLMEBOT_API_KEY: {envStatus.hasApiKey ? "מוגדר ✓" : "לא מוגדר ✗"}
                </span>
              </div>

              {(!envStatus.hasPhone || !envStatus.hasApiKey) && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>חשוב:</strong> משתני הסביבה לא מוגדרים בפרודקשן! הוסף אותם ב-Vercel Dashboard או בפלטפורמת
                    הפריסה שלך.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">בודק משתני סביבה...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            הגדרת התראות WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>שלב 1:</strong> הגדר את משתני הסביבה בפרודקשן
              <br />
              <strong>שלב 2:</strong> בצע הרשמה ל-CallMeBot
              <br />
              <strong>שלב 3:</strong> בדוק עם הכלי למטה
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold">שלבי הגדרה ל-CallMeBot:</h3>

            <div className="space-y-3 p-4 border rounded-lg bg-green-50">
              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">שלח הודעה ל-WhatsApp</p>
                  <p className="text-sm text-muted-foreground mb-2">שלח הודעה למספר הזה:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded">+34 644 59 71 67</code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard("+34 644 59 71 67")}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">תוכן ההודעה (בדיוק כך!)</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="bg-white px-2 py-1 rounded text-sm">I allow callmebot to send me messages</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard("I allow callmebot to send me messages")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">המתן לתגובה</p>
                  <p className="text-sm text-muted-foreground">תקבל הודעה חזרה עם ה-API Key שלך</p>
                </div>
              </div>

              <div className="pt-2">
                <Button asChild variant="default" size="sm" className="w-full">
                  <a
                    href="https://wa.me/34644597167?text=I%20allow%20callmebot%20to%20send%20me%20messages"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    פתח WhatsApp לשליחת ההודעה
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">מספר הטלפון שלך (עם קידומת)</Label>
                <Input
                  id="phone"
                  placeholder="+972501234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={
                    validatePhoneNumber(phoneNumber) ? "border-green-500" : phoneNumber ? "border-red-500" : ""
                  }
                />
                {phoneNumber && !validatePhoneNumber(phoneNumber) && (
                  <p className="text-sm text-red-600">פורמט לא תקין. דוגמה: +972501234567</p>
                )}
                {phoneNumber && validatePhoneNumber(phoneNumber) && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    פורמט תקין
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apikey">API Key מ-CallMeBot</Label>
                <Input
                  id="apikey"
                  placeholder="123456"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={validateApiKey(apiKey) ? "border-green-500" : apiKey ? "border-red-500" : ""}
                />
                {apiKey && !validateApiKey(apiKey) && (
                  <p className="text-sm text-red-600">API Key חייב להיות מספרים בלבד</p>
                )}
                {apiKey && validateApiKey(apiKey) && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    API Key תקין
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={testCallMeBotNotification}
              disabled={isTestingCallMeBot || !validatePhoneNumber(phoneNumber) || !validateApiKey(apiKey)}
              className="w-full"
            >
              {isTestingCallMeBot ? "שולח הודעת בדיקה..." : "בדוק התראות (ללא משתני סביבה)"}
            </Button>

            {debugInfo && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="font-medium mb-2">מידע דיבוג:</h4>
                <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            הוספת משתני סביבה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>חשוב:</strong> לאחר הבדיקה המוצלחת, הוסף את המשתנים האלה לסביבת הפרודקשן:
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">משתני סביבה להוספה:</h4>
              <div className="space-y-2 font-mono text-sm bg-gray-100 p-4 rounded">
                <div className="flex items-center justify-between">
                  <span>ADMIN_WHATSAPP_NUMBER={phoneNumber || "+972501234567"}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`ADMIN_WHATSAPP_NUMBER=${phoneNumber || "+972501234567"}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>CALLMEBOT_API_KEY={apiKey || "123456"}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(`CALLMEBOT_API_KEY=${apiKey || "123456"}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">איך להוסיף ב-Vercel:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>לך ל-Vercel Dashboard</li>
                <li>בחר את הפרויקט שלך</li>
                <li>לך ל-Settings → Environment Variables</li>
                <li>הוסף כל משתנה בנפרד</li>
                <li>לחץ על "Redeploy" לאחר ההוספה</li>
              </ol>
            </div>

            <Button asChild variant="outline" className="w-full bg-transparent">
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                פתח Vercel Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
