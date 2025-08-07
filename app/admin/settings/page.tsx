import { WhatsAppNotificationSetup } from "@/components/whatsapp-notification-setup"
import { AddEnvVarsGuide } from "./add-env-vars-guide"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">הגדרות מערכת</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/admin/orders">ניהול הזמנות</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">ניהול מוצרים</Link>
          </Button>
        </div>
      </div>

      <AddEnvVarsGuide />
      <WhatsAppNotificationSetup />
    </div>
  )
}
