"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Edit } from 'lucide-react'

interface Order {
  id: string
  customer_name: string
  phone: string
  delivery_option: "self_pickup" | "israel_post"
  payment_method: "bit" | "paypal" | "paybox"
  city?: string
  street?: string
  house_number?: string
  zip_code?: string
  total_price: number
  status: "pending" | "confirmed" | "rejected" | "cancelled"
}

interface EditOrderDialogProps {
  order: Order
}

export function EditOrderDialog({ order }: EditOrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      const updatedOrder = {
        customer_name: formData.get("customer_name") as string,
        phone: formData.get("phone") as string,
        delivery_option: formData.get("delivery_option") as "self_pickup" | "israel_post",
        payment_method: formData.get("payment_method") as "bit" | "paypal" | "paybox",
        city: formData.get("city") as string || null,
        street: formData.get("street") as string || null,
        house_number: formData.get("house_number") as string || null,
        zip_code: formData.get("zip_code") as string || null,
        total_price: parseFloat(formData.get("total_price") as string),
        status: formData.get("status") as "pending" | "confirmed" | "rejected" | "cancelled",
      }

      const response = await fetch("/api/admin/orders/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          ...updatedOrder,
        }),
      })

      if (response.ok) {
        toast({
          title: "הזמנה עודכנה בהצלחה",
          description: `הזמנה ${order.id} עודכנה`,
        })
        setIsOpen(false)
        window.location.reload()
      } else {
        const error = await response.text()
        toast({
          title: "שגיאה בעדכון ההזמנה",
          description: error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "שגיאה בעדכון ההזמנה",
        description: "אנא נסה שוב",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>עריכת הזמנה</DialogTitle>
          <DialogDescription>
            עדכן את פרטי ההזמנה {order.id}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">שם לקוח</Label>
              <Input
                id="customer_name"
                name="customer_name"
                defaultValue={order.customer_name}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={order.phone}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_option">אופן משלוח</Label>
              <Select name="delivery_option" defaultValue={order.delivery_option}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_pickup">איסוף עצמי</SelectItem>
                  <SelectItem value="israel_post">דואר ישראל</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method">אמצעי תשלום</Label>
              <Select name="payment_method" defaultValue={order.payment_method}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bit">Bit</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="paybox">PayBox</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">עיר</Label>
              <Input
                id="city"
                name="city"
                defaultValue={order.city || ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="street">רחוב</Label>
              <Input
                id="street"
                name="street"
                defaultValue={order.street || ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="house_number">מספר בית</Label>
              <Input
                id="house_number"
                name="house_number"
                defaultValue={order.house_number || ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zip_code">מיקוד</Label>
              <Input
                id="zip_code"
                name="zip_code"
                defaultValue={order.zip_code || ""}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="total_price">סה"כ מחיר</Label>
              <Input
                id="total_price"
                name="total_price"
                type="number"
                step="0.01"
                defaultValue={order.total_price}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">סטטוס</Label>
            <Select name="status" defaultValue={order.status}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="confirmed">מאושר</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem>
                <SelectItem value="cancelled">מבוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "שומר..." : "שמור שינויים"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
