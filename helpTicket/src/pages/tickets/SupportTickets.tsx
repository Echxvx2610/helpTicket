import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  Ticket, CheckCircle, AlertCircle, User, 
  Calendar, MapPin, ChevronRight, Loader2,
  Send, X, MessageSquare, Search, Trash2
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOrgSettings } from "@/contexts/OrgSettingsContext"

interface Ticket {
  id: string
  title: string
  description: string
  type: string
  priority: string
  location: string | null
  status: string
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  creator_email?: string
  creator_name?: string
}

interface Comment {
  id: string
  ticket_id: string
  author_id: string
  body: string
  is_internal: boolean
  created_at: string
  user_email?: string
  user_name?: string
}

interface Attachment {
  id: string
  file_name: string
  file_url: string
  file_size: number
  created_at: string
}

const PRIORITY_COLORS: Record<string, string> = {
  Baja: "bg-green-100 text-green-800",
  Media: "bg-yellow-100 text-yellow-800",
  Alta: "bg-orange-100 text-orange-800",
  Urgente: "bg-red-100 text-red-800",
}

const STATE_LABELS: Record<string, string> = {
  Abierto: "Abierto",
  "En progreso": "En Progreso",
  Resuelto: "Resuelto",
  Cerrado: "Cerrado",
}

export default function SupportTickets() {
  const { user, profile } = useAuth()
  const { settings } = useOrgSettings()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [supportUsers, setSupportUsers] = useState<any[]>([])

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (user && profile?.organization_id) {
      fetchTickets()
      if (profile.role === "admin") {
        fetchSupportUsers()
      }
    }
  }, [user, profile?.organization_id, profile?.role])

  const fetchSupportUsers = async () => {
    if (!profile?.organization_id) return
    const { data } = await supabase
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
      
    if (data) {
      const mappedUsers = data.map((m: any) => m.profiles).filter(Boolean)
      setSupportUsers(mappedUsers)
    }
  }

  useEffect(() => {
    if (selectedTicket) {
      fetchComments(selectedTicket.id)
      fetchAttachments(selectedTicket.id)
    } else {
      setComments([])
      setAttachments([])
    }
  }, [selectedTicket])

  const fetchTickets = async () => {
    if (!user || !profile?.organization_id) return

    setLoading(true)

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      const userIds = [...new Set(data.map(t => t.created_by).filter(Boolean))]

      let userProfiles: Record<string, { email: string; full_name?: string }> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)

        if (profiles) {
          profiles.forEach(p => {
            userProfiles[p.id] = { email: p.email, full_name: p.full_name }
          })
        }
      }

      const ticketsWithCreator = data.map(t => ({
        ...t,
        creator_email: userProfiles[t.created_by]?.email || "Usuario",
        creator_name: userProfiles[t.created_by]?.full_name || undefined
      }))

      setTickets(ticketsWithCreator)
    }
    setLoading(false)
  }

  const fetchComments = async (ticketId: string) => {
    setLoadingComments(true)
    const { data, error } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      const userIds = [...new Set(data.map(c => c.author_id).filter(Boolean))]
      let userProfiles: Record<string, { email: string; full_name?: string }> = {}

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds)

        if (profiles) {
          profiles.forEach(p => {
            userProfiles[p.id] = { email: p.email, full_name: p.full_name }
          })
        }
      }

      const commentsWithUser = data.map(c => ({
        ...c,
        user_email: userProfiles[c.author_id]?.email || "Usuario",
        user_name: userProfiles[c.author_id]?.full_name || undefined
      }))

      setComments(commentsWithUser)
    }
    setLoadingComments(false)
  }

  const fetchAttachments = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (!error && data) {
      setAttachments(data)
    }
  }

  const addComment = async (isInternal: boolean) => {
    if (!newComment.trim() || !selectedTicket || !user) return

    setSubmittingComment(true)
    const { error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: selectedTicket.id,
        author_id: user.id,
        body: newComment.trim(),
        is_internal: isInternal,
        organization_id: profile?.organization_id
      })

    if (!error) {
      setNewComment("")
      fetchComments(selectedTicket.id)
    } else {
      console.error("Error adding comment:", error)
    }
    setSubmittingComment(false)
  }

  const updateAssignee = async (ticketId: string, assigneeId: string | null) => {
    if (!user) return

    setUpdating(ticketId)
    const { error } = await supabase
      .from("tickets")
      .update({
        assigned_to: assigneeId,
        status: assigneeId ? "En progreso" : "Abierto"
      })
      .eq("id", ticketId)

    if (error) {
      console.error("Error assigning ticket:", error)
      alert(`Error: ${error.message}`)
    } else {
      fetchTickets()
    }
    setUpdating(null)
  }

  const deleteTicket = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm("¿Seguro que deseas eliminar permanentemente este ticket? Esta acción no se puede deshacer.")) return;
    
    setUpdating(id)
    
    // Primero eliminar referencias (comentarios y adjuntos)
    const { error: errComments } = await supabase.from("ticket_comments").delete().eq("ticket_id", id)
    if (errComments) console.error("Error al eliminar comentarios:", errComments)

    const { error: errAttachments } = await supabase.from("ticket_attachments").delete().eq("ticket_id", id)
    if (errAttachments) console.error("Error al eliminar adjuntos:", errAttachments)

    // Eliminar el ticket principal y verificar si fue afectado (RLS puede bloquear sin error)
    const { data: deleted, error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", id)
      .select()

    if (error) {
      alert("Error eliminando ticket: " + error.message)
    } else if (!deleted || deleted.length === 0) {
      alert("No se pudo eliminar el ticket. Verifica que tengas permisos (política RLS) para eliminar tickets en Supabase.")
    } else {
      setSelectedTicket(null)
      fetchTickets()
    }
    setUpdating(null)
  }

  const updateStatus = async (ticketId: string, newStatus: string) => {
    setUpdating(ticketId)
    const updatePayload: any = { status: newStatus }
    
    if (newStatus === "Resuelto") {
      updatePayload.resolved_at = new Date().toISOString()
    } else if (newStatus === "Cerrado") {
      updatePayload.closed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("tickets")
      .update(updatePayload)
      .eq("id", ticketId)

    if (error) {
      console.error("Error updating status:", error)
      alert(`Error: ${error.message}`)
    } else {
      fetchTickets()
    }
    setUpdating(null)
  }

  const filteredTickets = tickets.filter(ticket => {
    let matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    let matchesAssignee = assigneeFilter === "all"
    
    if (assigneeFilter === "unassigned") {
      matchesAssignee = !ticket.assigned_to;
    } else if (assigneeFilter === "me") {
      matchesAssignee = ticket.assigned_to === user?.id;
    } else if (assigneeFilter !== "all") {
      matchesAssignee = ticket.assigned_to === assigneeFilter;
    }
    
    if (!matchesStatus || !matchesAssignee) return false

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        ticket.title.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term) ||
        ticket.type.toLowerCase().includes(term) ||
        ticket.priority.toLowerCase().includes(term) ||
        (ticket.location && ticket.location.toLowerCase().includes(term)) ||
        (ticket.creator_name && ticket.creator_name.toLowerCase().includes(term))
      )
    }
    return true
  })

  const unassignedCount = tickets.filter(t => !t.assigned_to && t.status === "Abierto").length
  const myTicketsCount = tickets.filter(t => t.assigned_to === user?.id && t.status !== "Cerrado").length

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">{settings.ticket_label}s de {settings.support_role_label}</h2>
          <p className="text-muted-foreground">Gestiona y atiende las solicitudes de {settings.user_role_label.toLowerCase()}s</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card
          className={`relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-red-50/80 to-white group ${assigneeFilter === "unassigned" ? "ring-2 ring-red-400" : ""}`}
          onClick={() => { setAssigneeFilter("unassigned"); setStatusFilter("Abierto"); }}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-red-900 uppercase tracking-wider">Sin Asignar</CardTitle>
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-red-950 tracking-tight">{unassignedCount}</div>
            <p className="text-xs text-red-600 mt-2 font-medium">Pendientes de atención</p>
          </CardContent>
        </Card>

        <Card
          className={`relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-50/80 to-white group ${assigneeFilter === "me" ? "ring-2 ring-blue-400" : ""}`}
          onClick={() => { setAssigneeFilter("me"); setStatusFilter("all"); }}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Mis {settings.ticket_label}s</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Ticket className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-blue-950 tracking-tight">{myTicketsCount}</div>
            <p className="text-xs text-blue-600 mt-2 font-medium">Asignados a ti</p>
          </CardContent>
        </Card>

        <Card
          className={`relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-green-50/80 to-white group ${(assigneeFilter === "all" && statusFilter === "all") ? "ring-2 ring-green-400" : ""}`}
          onClick={() => { setAssigneeFilter("all"); setStatusFilter("all"); }}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-green-900 uppercase tracking-wider">Total</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-green-950 tracking-tight">{tickets.length}</div>
            <p className="text-xs text-green-600 mt-2 font-medium">Todos los {settings.ticket_label.toLowerCase()}s</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm relative">
        <div className="flex items-center flex-1 w-full gap-2 text-gray-500">
          <Search className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={`Buscar ${settings.ticket_label.toLowerCase()}s por título, descripción, ${settings.location_label.toLowerCase()}, prioridad o usuario...`} 
            className="w-full bg-transparent text-sm border-none focus:ring-0 outline-none placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-gray-500 hover:text-gray-700 rounded-md" onClick={() => setSearchTerm("")}>
              Limpiar
            </Button>
          )}
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-gray-50"><SelectValue placeholder="Estado..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier estado</SelectItem>
              <SelectItem value="Abierto">Abierto</SelectItem>
              <SelectItem value="En progreso">En progreso</SelectItem>
              <SelectItem value="Resuelto">Resuelto</SelectItem>
              <SelectItem value="Cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
          
          {profile?.role === "admin" ? (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-gray-50"><SelectValue placeholder="Asignado a..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Asignado a: Todos</SelectItem>
                <SelectItem value="unassigned">Sin Asignar</SelectItem>
                {supportUsers.map(su => (
                   <SelectItem key={su.id} value={su.id}>{su.full_name || su.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-gray-50"><SelectValue placeholder={`Mis ${settings.ticket_label.toLowerCase()}s`} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Asignado a: Todos</SelectItem>
                <SelectItem value="me">Mis {settings.ticket_label}s</SelectItem>
                <SelectItem value="unassigned">Sin Asignar</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Directorio de {settings.ticket_label}s
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Ticket className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No hay resultados
                  </h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Revisa tus filtros de asignación, estatus o el texto de búsqueda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`group flex flex-col p-5 border rounded-xl hover:shadow-md transition-all bg-white cursor-pointer ${selectedTicket?.id === ticket.id
                        ? "border-blue-400 shadow-md bg-blue-50/40"
                        : "border-gray-100 hover:border-blue-200"
                        }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-semibold text-gray-800 truncate text-base">{ticket.title}</span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
                            <span className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1 min-w-0">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px]">{ticket.creator_name || ticket.creator_email}</span>
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded-md">{ticket.type}</span>
                            {ticket.location && (
                              <span className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {ticket.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(ticket.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 items-end">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border ${ticket.status === "Abierto"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : ticket.status === "En progreso"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : ticket.status === "Resuelto"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                          >
                            {STATE_LABELS[ticket.status] || ticket.status}
                          </span>

                          {(profile?.role === "admin" || ticket.assigned_to === user?.id) ? (
                            <div className="flex flex-col gap-1 items-end mt-2">
                              {profile?.role === "admin" ? (
                                <Select
                                  value={ticket.assigned_to || "unassigned"}
                                  onValueChange={(value) => {
                                    updateAssignee(ticket.id, value === "unassigned" ? null : value)
                                  }}
                                  disabled={updating === ticket.id}
                                >
                                  <SelectTrigger className="h-7 w-[140px] text-[10px]" onClick={(e) => e.stopPropagation()}>
                                    <SelectValue placeholder="Asignar a..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Sin Asignar</SelectItem>
                                    {supportUsers.map(su => (
                                      <SelectItem key={su.id} value={su.id}>{su.full_name || su.email}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-green-600 font-medium whitespace-nowrap">Asignado a ti</span>
                              )}
                              
                              <Select
                                value={ticket.status}
                                onValueChange={(value) => updateStatus(ticket.id, value)}
                                disabled={updating === ticket.id || (profile?.role === "support" && (ticket.status === "Resuelto" || ticket.status === "Cerrado"))}
                              >
                                <SelectTrigger className="h-7 w-[140px] text-[10px]" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Abierto">Abierto</SelectItem>
                                  <SelectItem value="En progreso">En progreso</SelectItem>
                                  <SelectItem value="Resuelto">Resuelto</SelectItem>
                                  <SelectItem value="Cerrado">Cerrado</SelectItem>
                                </SelectContent>
                              </Select>

                              {profile?.role === "support" && ticket.status !== "Resuelto" && ticket.status !== "Cerrado" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-[10px] w-[140px]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateAssignee(ticket.id, null)
                                  }}
                                  disabled={updating === ticket.id}
                                >
                                  Liberar Ticket
                                </Button>
                              )}
                            </div>
                          ) : !ticket.assigned_to && ticket.status === "Abierto" && profile?.role === "support" ? (
                            <Button
                              size="sm"
                              className="gap-1 mt-2 h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateAssignee(ticket.id, user?.id ?? null)
                              }}
                              disabled={updating === ticket.id}
                            >
                              {updating === ticket.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              Tomar {settings.ticket_label.toLowerCase()}
                            </Button>
                          ) : ticket.assigned_to && profile?.role === "support" ? (
                            <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">
                              Agente asignado
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Comentarios</CardTitle>
              <div className="flex gap-2">
                {profile?.role === "admin" && selectedTicket && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => deleteTicket(selectedTicket.id, e)}
                    title="Eliminar ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                {selectedTicket && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setSelectedTicket(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!selectedTicket ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <MessageSquare className="w-8 h-8 text-gray-300 mb-3" />
                  Selecciona un {settings.ticket_label.toLowerCase()} para ver y agregar notas/respuestas.
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="font-semibold text-sm truncate text-gray-800">{selectedTicket.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{selectedTicket.type} • {selectedTicket.priority}</p>

                    {attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Archivos Adjuntos</p>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map(att => (
                            <a
                              key={att.id}
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 px-2.5 py-1.5 rounded-md text-xs transition-colors group"
                            >
                              <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-blue-600">
                                <span className="font-bold text-[8px]">FILE</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-700 group-hover:text-blue-700 truncate max-w-[120px] leading-tight">{att.file_name}</span>
                                <span className="text-[9px] text-gray-400">{formatFileSize(att.file_size)}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px]">
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        No hay comentarios aún
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isMyComment = comment.author_id === user?.id;

                        return (
                          <div
                            key={comment.id}
                            className={`p-3.5 rounded-xl text-sm max-w-[90%] shadow-sm ${comment.is_internal
                              ? "bg-amber-50 border border-amber-200 self-end ml-auto"
                              : isMyComment
                                ? "bg-blue-50 border border-blue-100 self-end ml-auto"
                                : "bg-white border border-gray-200 self-start mr-auto"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5 gap-3">
                              <span className={`font-semibold text-xs ${comment.is_internal ? 'text-amber-800' : isMyComment ? 'text-blue-800' : 'text-gray-700'}`}>
                                {isMyComment ? "Tú" : (comment.user_name || comment.user_email)}
                              </span>
                              {comment.is_internal && (
                                <span className="text-[9px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                  Nota Interna
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed break-words">{comment.body}</p>
                            <span className="text-[10px] text-gray-400 mt-2 block text-right font-medium">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  {selectedTicket.status === "Resuelto" || selectedTicket.status === "Cerrado" ? (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-sm text-muted-foreground rounded-b-xl">
                      Este {settings.ticket_label.toLowerCase()} ha sido marcado como {selectedTicket.status.toLowerCase()}. El hilo de comentarios está cerrado.
                      {profile?.role === "support" && " Si fue un error o falsa alarma, contacta a un administrador para reabrir y liberar el ticket."}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <Textarea
                        placeholder="Escribe tu respuesta o nota..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[90px] text-sm resize-none rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            if (newComment.trim() && !submittingComment) {
                              addComment(false) // Por defecto: Respuesta Pública
                            }
                          }
                        }}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold"
                          onClick={() => addComment(true)}
                          disabled={!newComment.trim() || submittingComment}
                        >
                          {submittingComment ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                              Guardar Interno
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => addComment(false)}
                          disabled={!newComment.trim() || submittingComment}
                          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                        >
                          {submittingComment ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1.5" />
                              Responder
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
