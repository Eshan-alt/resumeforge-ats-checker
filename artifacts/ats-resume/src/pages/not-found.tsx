import { useLocation } from "wouter"
import { Button } from "@/components/ui/button"
import { Briefcase, AlertCircle } from "lucide-react"

export default function NotFound() {
  const [, setLocation] = useLocation()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="text-center p-8 max-w-md w-full bg-card rounded-xl border shadow-sm">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6 text-muted-foreground">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-primary mb-2">404</h1>
        <p className="text-muted-foreground mb-8 text-lg">Page not found or you don't have access to it.</p>
        <Button onClick={() => setLocation("/")} className="w-full h-12 text-md gap-2">
          <Briefcase className="w-4 h-4" /> Go to Dashboard
        </Button>
      </div>
    </div>
  )
}