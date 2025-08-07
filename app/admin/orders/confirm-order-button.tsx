"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { confirmOrder } from "@/lib/actions"
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

// Update the interface to include onSuccess callback
export function ConfirmOrderButton({ orderId, onSuccess }: { orderId: string; onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleClick = async () => {
    setIsLoading(true)
    const result = await confirmOrder(orderId)
    if (result.success) {
      toast({ title: "ההזמנה אושרה בהצלחה" })
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
        <Button size="sm">{isLoading ? "מאשר..." : "אשר תשלום"}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent aria-describedby="confirm-order-description">
        <AlertDialogHeader>
          <AlertDialogTitle>אישור הזמנה</AlertDialogTitle>
          <AlertDialogDescription id="confirm-order-description">
            האם אתה בטוח שברצונך לאשר הזמנה זו? פעולה זו תעדכן את המלאי, תסמן את ההזמנה כמאושרת והלקוח יקבל הודעה על
            האישור.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={handleClick} disabled={isLoading}>
            {isLoading ? "מאשר..." : "אשר הזמנה"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
