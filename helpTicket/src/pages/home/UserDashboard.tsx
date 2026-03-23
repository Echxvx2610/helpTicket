import { Ticket, History, MessageSquare, PlusCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function UserDashboard() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Mis Tickets</h2>
          <p className="text-muted-foreground">Gestiona tus solicitudes de soporte.</p>
        </div>
        <Button className="gap-2 rounded-lg shadow-sm hover:shadow-md transition-all">
          <PlusCircle className="w-4 h-4" /> Nuevo Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
            <Ticket className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Esperando soporte</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Tickets Resueltos</CardTitle>
            <History className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Historial completo</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Nuevos Comentarios</CardTitle>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Mensajes sin leer</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm mt-4">
        <CardHeader>
          <CardTitle>Historial Reciente</CardTitle>
          <CardDescription>Tus últimos tickets generados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
            <Ticket className="w-10 h-10 text-gray-300 mb-3" />
            <p>No tienes tickets recientes</p>
            <p className="text-sm">Crea un ticket nuevo si necesitas ayuda.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
