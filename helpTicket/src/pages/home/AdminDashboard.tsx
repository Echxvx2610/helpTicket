import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { ShieldCheck, Users, Activity, Settings, TrendingUp, Loader2, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Link } from "react-router-dom"

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [unassignedTickets, setUnassignedTickets] = useState<any[]>([])
  const [supportUsers, setSupportUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.organization_id) {
      fetchData()
    }
  }, [profile?.organization_id])

  const fetchData = async () => {
    if (!profile?.organization_id) return
    setLoading(true)

    // Fetch up to 5 unassigned tickets
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, title, priority, created_at, created_by")
      .eq("organization_id", profile.organization_id)
      .eq("status", "Abierto")
      .is("assigned_to", null)
      .order("created_at", { ascending: false })
      .limit(5)
      
    if (tickets && tickets.length > 0) {
      const userIds = [...new Set(tickets.map(t => t.created_by).filter(Boolean))]
      let userProfiles: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)

        if (profiles) {
          profiles.forEach(p => {
            userProfiles[p.id] = p.full_name || p.email
          })
        }
      }

      setUnassignedTickets(tickets.map(t => ({
        ...t,
        creator_name: userProfiles[t.created_by] || "Usuario"
      })))
    } else {
      setUnassignedTickets([])
    }

    // Fetch support users
    const { data: sUsers } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("organization_id", profile.organization_id)
      .eq("role", "support")
      
    if (sUsers) setSupportUsers(sUsers)
    setLoading(false)
  }

  const assignTicket = async (ticketId: string, assigneeId: string) => {
    setUpdating(ticketId)
    const { error } = await supabase
      .from("tickets")
      .update({
        assigned_to: assigneeId,
        status: "En progreso"
      })
      .eq("id", ticketId)

    if (!error) {
      fetchData()
    } else {
      console.error("Error asignando ticket:", error)
      alert("Error: " + error.message)
    }
    setUpdating(null)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-primary" /> Panel de Administración
        </h2>
        <p className="text-muted-foreground">Análisis global, asignaciones y estadísticas del sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestión de Usuarios</div>
            <p className="text-xs text-muted-foreground mt-1">Administrar roles y perfiles</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Salud del Sistema</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Óptimo</div>
            <p className="text-xs text-muted-foreground mt-1">Todos los servicios en línea</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rendimiento (SLAs)</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground mt-1">Métricas de tiempo de respuesta</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="shadow-sm lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Cola Rápida de Asignación</CardTitle>
              <CardDescription>Tickets recientes pendientes de soporte</CardDescription>
            </div>
            <Link to="/tickets" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-1 h-8">
                Panel Completo <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : unassignedTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
                <ShieldCheck className="w-10 h-10 text-green-400 mb-3" />
                <p>Excelente, no hay tickets pendientes en la cola.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unassignedTickets.map(ticket => (
                  <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-red-100 rounded-lg shadow-sm hover:border-red-300 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{ticket.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground truncate">
                        <span className={`px-1.5 py-0.5 rounded font-medium ${ticket.priority === 'Urgente' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                          {ticket.priority}
                        </span>
                        <span>•</span>
                        <span className="truncate">{ticket.creator_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select 
                        disabled={updating === ticket.id} 
                        onValueChange={(val) => assignTicket(ticket.id, val)}
                      >
                        <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs bg-red-50 border-red-200 text-red-900 focus:ring-red-500">
                          {updating === ticket.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-red-500" /> : <SelectValue placeholder="Asignar agente..." />}
                        </SelectTrigger>
                        <SelectContent>
                          {supportUsers.map(su => (
                            <SelectItem key={su.id} value={su.id}>{su.full_name || su.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                
                {unassignedTickets.length >= 5 && (
                  <div className="text-center mt-4">
                    <Link to="/tickets">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 text-xs gap-1">
                        Ver todos los tickets sin asignar <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos eventos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
              <Settings className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm">El sistema se encuentra configurado y funcionando óptimamente.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
