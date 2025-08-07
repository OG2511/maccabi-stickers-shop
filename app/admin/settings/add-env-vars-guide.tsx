"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, Copy, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AddEnvVarsGuide() {
  const { toast } = useToast()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "הועתק!", description: "הטקסט הועתק ללוח" })
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          הוספת משתני סביבה ב-Vercel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>חשוב:</strong> אם ההתראות לא עובדות, כנראה שמשתני הסביבה לא מוגדרים ב-Vercel.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-medium">שלבים להוספה:</h4>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>לך ל-Vercel Dashboard</li>
            <li>בחר את הפרויקט "maccabi-stickers-shop"</li>
            <li>לחץ על Settings</li>
            <li>לחץ על Environment Variables</li>
            <li>הוסף את המשתנים הבאים:</li>
          </ol>

          <div className="space-y-3 bg-gray-100 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <strong>Name:</strong> ADMIN_WHATSAPP_NUMBER
                <br />
                <strong>Value:</strong> +972532062390
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard("+972532062390")}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <strong>Name:</strong> CALLMEBOT_API_KEY
                <br />
                <strong>Value:</strong> [הערך שקיבלת מ-CallMeBot]
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard("CALLMEBOT_API_KEY")}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">לאחר ההוספה:</p>
            <ul className="text-sm space-y-1 list-disc list-inside mr-4">
              <li>לחץ על "Save"</li>
              <li>לחץ על "Redeploy" (או חכה לפריסה אוטומטית)</li>
              <li>בדוק שוב עם הזמנה חדשה</li>
            </ul>
          </div>

          <Button asChild className="w-full">
            <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              פתח Vercel Dashboard
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
