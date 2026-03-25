import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { useOrgSettings } from "@/contexts/OrgSettingsContext"
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
  const { settings } = useOrgSettings()
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
    const { data: sUsersData } = await supabase
      .from("organization_members")
      .select(`
        profiles (
          id,
          full_name,
          email
        )
      `)
      .eq("organization_id", profile.organization_id)
      .in("role", ["support", "admin"])
      
    if (sUsersData) {
      const mappedUsers = sUsersData.map((m: any) => m.profiles).filter(Boolean)
      setSupportUsers(mappedUsers)
    }
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
        <p className="text-muted-foreground">Análisis global de {settings.system_name}, asignaciones y estadísticas.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-blue-50/80 to-white group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Usuarios Registrados</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-blue-950 tracking-tight">Gestión</div>
            <p className="text-xs text-blue-600 mt-2 font-medium">Administrar roles y perfiles</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-green-50/80 to-white group">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-green-900 uppercase tracking-wider">Salud del Sistema</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <Activity className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-green-950 tracking-tight">Óptimo</div>
            <p className="text-xs text-green-600 mt-2 font-medium">Todos los servicios en línea</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-indigo-50/80 to-white group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-indigo-900 uppercase tracking-wider">Rendimiento (SLAs)</CardTitle>
            <div className="p-2 bg-indigo-100 rounded-full">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-indigo-950 tracking-tight">---</div>
            <p className="text-xs text-indigo-600 mt-2 font-medium">Métricas de tiempo de respuesta</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="shadow-sm lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Cola Rápida de Asignación</CardTitle>
              <CardDescription>{settings.ticket_label}s recientes pendientes de {settings.support_role_label.toLowerCase()}</CardDescription>
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
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {unassignedTickets.map(ticket => (
                  <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-red-100 rounded-lg shadow-sm hover:border-red-300 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{ticket.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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
