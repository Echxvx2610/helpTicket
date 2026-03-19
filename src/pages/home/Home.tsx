import { LayoutDashboard } from "lucide-react"

export default function Home() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <LayoutDashboard className="size-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Bienvenido a HelpTickets</h2>
      <p className="text-muted-foreground max-w-sm">Aquí puedes ver un resumen general del estado del sistema y acceso rápido a tus opciones.</p>
    </div>
  )
}
