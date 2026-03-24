import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Ticket, CheckCircle, AlertCircle, Loader2, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

export default function SupportDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({
    unassigned: 0,
    myTickets: 0,
    resolvedToday: 0,
    activeUsers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile?.organization_id) {
      fetchStats()
    }
  }, [user, profile?.organization_id])

  const fetchStats = async () => {
    if (!user || !profile?.organization_id) return

    setLoading(true)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, status, assigned_to, created_by, updated_at")
      .eq("organization_id", profile.organization_id)

    if (tickets) {
      const unassigned = tickets.filter(t => !t.assigned_to && t.status === "Abierto").length
      const myTickets = tickets.filter(t => t.assigned_to === user.id && t.status !== "Cerrado" && t.status !== "Resuelto").length
      const resolvedToday = tickets.filter(t => 
        (t.status === "Resuelto" || t.status === "Cerrado") && 
        t.updated_at >= todayStr
      ).length

      const creatorIds = [...new Set(tickets.map(t => t.created_by).filter(Boolean))]
      const activeUsers = creatorIds.length

      setStats({
        unassigned,
        myTickets,
        resolvedToday,
        activeUsers
      })
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800">Panel de Soporte</h2>
        <p className="text-muted-foreground">Gestiona la cola de tickets y asignaciones.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all bg-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.unassigned}
            </div>
            <p className="text-xs text-red-500">Requieren atención</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Mis Asignados</CardTitle>
            <Ticket className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.myTickets}
            </div>
            <p className="text-xs text-muted-foreground">En proceso</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Resueltos Hoy</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.resolvedToday}
            </div>
            <p className="text-xs text-muted-foreground">Tickets cerrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">Con interacciones</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="shadow-sm lg:col-span-4">
          <CardHeader>
            <CardTitle>Cola General de Tickets</CardTitle>
            <CardDescription>Tickets esperando ser asignados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : stats.unassigned > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="font-medium text-red-800">{stats.unassigned} ticket(s) sin asignar</p>
                    <p className="text-sm text-red-600">Requiere atención inmediata</p>
                  </div>
                  <Link to="/tickets">
                    <Button size="sm" className="gap-1">
                      Ver Tickets
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
                <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
                <p>¡Todo al día!</p>
                <p className="text-sm">No hay tickets pendientes en la cola.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle>Mis Tareas</CardTitle>
            <CardDescription>Tickets asignados a ti</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats.myTickets > 0 ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div>
                  <p className="font-medium text-blue-800">{stats.myTickets} ticket(s) en proceso</p>
                  <p className="text-sm text-blue-600">Atiende los tickets asignados</p>
                </div>
                <Link to="/tickets">
                  <Button size="sm" variant="outline" className="gap-1">
                    Ver
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
                <p className="text-sm">No tienes tickets asignados en este momento.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}