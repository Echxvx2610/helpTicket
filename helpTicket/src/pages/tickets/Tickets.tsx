import { Ticket } from "lucide-react"

export default function Tickets() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Ticket className="size-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Sistema de Tickets</h2>
      <p className="text-muted-foreground max-w-sm">Revisa las solicitudes de soporte, asigalas o comunícate con el equipo de respuesta rápida.</p>
    </div>
  )
}
