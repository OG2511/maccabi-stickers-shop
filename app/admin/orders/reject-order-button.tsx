"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { rejectOrder } from "@/lib/actions"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

export function RejectOrderButton({ orderId, onSuccess }: { orderId: string; onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleReject = async () => {
    setIsLoading(true)
    console.log("🔴 Rejecting order:", orderId)

    const result = await rejectOrder(orderId)

    if (result.success) {
      toast({ title: "ההזמנה נדחתה", variant: "destructive" })
      setOpen(false)
      onSuccess?.()
      router.refresh()
    } else {
      toast({ title: "שגיאה", description: result.error, variant: "destructive" })
    }
    setIsLoading(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          דחה
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent aria-describedby="reject-order-description">
        <AlertDialogHeader>
          <AlertDialogTitle>דחיית הזמנה</AlertDialogTitle>
          <AlertDialogDescription id="reject-order-description">
            האם אתה בטוח שברצונך לדחות הזמנה זו? פעולה זו לא ניתנת לביטול והלקוח יקבל הודעה שההזמנה נדחתה. ההזמנה תסומן
            כ"נדחתה" במערכת.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleReject} disabled={isLoading}>
            {isLoading ? "דוחה..." : "דחה הזמנה"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
