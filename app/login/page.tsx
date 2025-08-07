import { login } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string }
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>כניסת מנהל</CardTitle>
          <CardDescription>הזן את פרטי ההתחברות שלך</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" placeholder="הזן אימייל" required autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="הזן סיסמה"
                required
                autoComplete="current-password"
              />
            </div>
            <Button formAction={login} className="w-full" type="submit">
              התחבר
            </Button>
            {searchParams?.message && (
              <p className="mt-4 p-2 bg-red-100 text-red-700 text-center text-sm rounded">{searchParams.message}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
