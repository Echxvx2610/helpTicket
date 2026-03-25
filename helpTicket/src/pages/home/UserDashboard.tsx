import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useOrgSettings } from "@/contexts/OrgSettingsContext"
import { supabase } from "@/lib/supabaseClient"
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog"
import { Card, CardContent } from "@/components/ui/card"
import {
  PlusCircle,
  Ticket,
  BookOpen,
  Clock,
  ArrowRight,
  Search,
  MessageSquare,
} from "lucide-react"

interface TicketData {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
}


const STATE_LABELS: Record<string, string> = {
  Abierto: "Abierto",
  "En progreso": "En Progreso",
  Resuelto: "Resuelto",
  Cerrado: "Cerrado",
}

export default function UserDashboard() {
  const { profile, user } = useAuth()
  const { settings } = useOrgSettings()
  const [recentTickets, setRecentTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const firstName = profile?.full_name?.split(" ")[0] || "..."

  const fetchRecentTickets = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from("tickets")
      .select("id, title, status, priority, created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(3)

    if (!error && data) {
      setRecentTickets(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      fetchRecentTickets()
    }
  }, [user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    })
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      {/* Banner de Bienvenida */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 sm:p-10 shadow-lg text-white">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 truncate pr-4">
            ¡Hola, {firstName}! 👋
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mb-8">
            Bienvenido a {settings.system_name}. ¿En qué te podemos ayudar hoy? Estamos aquí para resolver tus inquietudes.
          </p>

          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Buscar en la base de conocimientos..."
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-blue-200 rounded-full py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-200 pointer-events-none" />
          </div>
        </div>

        {/* Elementos decorativos */}
        <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute right-32 bottom-0 translate-y-1/4 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md bg-white overflow-hidden"
          onClick={() => setDialogOpen(true)}
        >
          <CardContent className="p-6 flex flex-col items-center text-center h-full relative">
            <div className="absolute top-0 w-full h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">Crear {settings.ticket_label}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">Reporta un nuevo problema o solicitud técnica.</p>
          </CardContent>
        </Card>

        <Link to="/tickets" className="block outline-none">
          <Card className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md bg-white overflow-hidden h-full">
            <CardContent className="p-6 flex flex-col items-center text-center h-full relative">
              <div className="absolute top-0 w-full h-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Ticket className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">Mis {settings.ticket_label}s</h3>
              <p className="text-sm text-gray-500 line-clamp-2">Revisa el estado de todas tus solicitudes activas.</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none shadow-md bg-white overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center text-center h-full relative">
            <div className="absolute top-0 w-full h-1 bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">Base de Ayuda</h3>
            <p className="text-sm text-gray-500 line-clamp-2">Encuentra guías y soluciones paso a paso.</p>
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Actividad Reciente
          </h2>
          <Link to="/tickets" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Ver todo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Card className="border-none shadow-md overflow-hidden bg-white flex flex-col">
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[320px] scrollbar-thin scrollbar-thumb-gray-200">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Cargando historial...
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="bg-gray-50 rounded-full p-4 mb-3">
                  <Ticket className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-800 font-medium">Aún no tienes tickets registrados</p>
                <p className="text-sm text-gray-500 mt-1">Tus futuras solicitudes de soporte aparecerán aquí.</p>
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="p-5 hover:bg-gray-50/80 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm md:text-base line-clamp-1">{ticket.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs font-medium">
                        <span className={`px-2 py-0.5 rounded-full ${ticket.status === "Abierto"
                          ? "bg-blue-100 text-blue-800"
                          : ticket.status === "En progreso"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                          }`}>
                          {STATE_LABELS[ticket.status] || ticket.status}
                        </span>
                        <span className="text-gray-400 flex items-center gap-1">
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/tickets`} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <CreateTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchRecentTickets}
      />
    </div>
  )
}
