import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog"
import { PlusCircle, Ticket, Clock, CheckCircle, AlertCircle, Send, X, Loader2, MessageSquare } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useOrgSettings } from "@/contexts/OrgSettingsContext"

interface Ticket {
  id: string
  title: string
  description: string
  type: string
  priority: string
  location: string | null
  status: string
  created_at: string
  updated_at: string
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

export default function UserTickets() {
  const { user, profile } = useAuth()
  const { settings } = useOrgSettings()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  const openTickets = tickets.filter((t) => t.status === "Abierto").length
  const inProgressTickets = tickets.filter((t) => t.status === "En progreso").length
  const resolvedTickets = tickets.filter((t) => t.status === "Resuelto" || t.status === "Cerrado").length

  useEffect(() => {
    if (user) {
      fetchTickets()
    }
  }, [user])

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
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTickets(data)
    }
    setLoading(false)
  }

  const fetchComments = async (ticketId: string) => {
    setLoadingComments(true)
    const { data, error } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("is_internal", false) // Solo comentarios públicos
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

  const addComment = async () => {
    if (!newComment.trim() || !selectedTicket || !user) return

    setSubmittingComment(true)
    const { error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: selectedTicket.id,
        author_id: user.id,
        body: newComment.trim(),
        is_internal: false, // Siempre público desde usuario final
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Mis {settings.ticket_label}s</h2>
          <p className="text-muted-foreground">Gestiona tus solicitudes de {settings.support_role_label.toLowerCase()}</p>
        </div>
        <Button
          className="gap-2 rounded-lg shadow-sm hover:shadow-md transition-all"
          onClick={() => setDialogOpen(true)}
        >
          <PlusCircle className="w-4 h-4" /> Nuevo {settings.ticket_label}
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-blue-50/80 to-white group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Abiertos</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-blue-950 tracking-tight">{openTickets}</div>
            <p className="text-xs text-blue-600 mt-2 font-medium">Esperando atención</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-yellow-50/80 to-white group">
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-yellow-900 uppercase tracking-wider">En Progreso</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-yellow-950 tracking-tight">{inProgressTickets}</div>
            <p className="text-xs text-yellow-600 mt-2 font-medium">Siendo atendidos</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none shadow-sm hover:shadow-lg transition-all bg-gradient-to-br from-green-50/80 to-white group">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500 group-hover:w-1.5 transition-all" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
            <CardTitle className="text-sm font-semibold text-green-900 uppercase tracking-wider">Resueltos</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-black text-green-950 tracking-tight">{resolvedTickets}</div>
            <p className="text-xs text-green-600 mt-2 font-medium">Completados o Cerrados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Historial de {settings.ticket_label}s</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Ticket className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No tienes {settings.ticket_label.toLowerCase()}s generados</h3>
                  <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                    Tu historial está completamente limpio. Si tienes alguna incidencia, solicitud o duda, puedes generar un {settings.ticket_label.toLowerCase()} y te ayudaremos pronto.
                  </p>
                  <Button
                    size="lg"
                    className="rounded-full px-8 shadow-md hover:shadow-lg transition-all"
                    onClick={() => setDialogOpen(true)}
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Crear mi primer {settings.ticket_label.toLowerCase()}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 border rounded-xl hover:shadow-md transition-all bg-white gap-4 cursor-pointer ${selectedTicket?.id === ticket.id
                          ? "border-blue-400 shadow-md bg-blue-50/40"
                          : "border-gray-100 hover:border-blue-200"
                        }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
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
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <span className="bg-gray-100 px-2 py-1 rounded-md">{ticket.type}</span>
                          {ticket.location && <span className="bg-gray-100 px-2 py-1 rounded-md">{ticket.location}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center sm:justify-end">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border ${ticket.status === "Abierto"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : ticket.status === "En progreso"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                        >
                          {STATE_LABELS[ticket.status] || ticket.status}
                        </span>
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
              <CardTitle className="text-lg">Conversación</CardTitle>
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
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {!selectedTicket ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <MessageSquare className="w-8 h-8 text-gray-300 mb-3" />
                  Selecciona un {settings.ticket_label.toLowerCase()} a la izquierda para ver el historial de mensajes y comunicarte con {settings.support_role_label.toLowerCase()}.
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="font-semibold text-sm truncate text-gray-800">{selectedTicket.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{selectedTicket.status}</p>

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

                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] border-b border-gray-100 pb-3">
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8 bg-white border border-dashed border-gray-200 rounded-xl">
                        Aún no hay respuestas de {settings.support_role_label.toLowerCase()} para este {settings.ticket_label.toLowerCase()}.
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isMyComment = comment.author_id === user?.id;

                        return (
                          <div
                            key={comment.id}
                            className={`p-3.5 rounded-xl text-sm max-w-[90%] shadow-sm ${isMyComment
                                ? "bg-blue-50 border border-blue-100 self-end ml-auto"
                                : "bg-white border border-gray-200 self-start mr-auto"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5 gap-3">
                              <span className={`font-semibold text-xs ${isMyComment ? 'text-blue-800' : 'text-gray-700'}`}>
                                {isMyComment ? "Tú" : (comment.user_name || `Equipo de ${settings.support_role_label}`)}
                              </span>
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

                  {selectedTicket.status !== "Cerrado" && selectedTicket.status !== "Resuelto" ? (
                    <div className="space-y-3 pt-2">
                      <Textarea
                        placeholder="Escribe tu respuesta o duda..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[90px] text-sm resize-none rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            if (newComment.trim() && !submittingComment) {
                              addComment() 
                            }
                          }
                        }}
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={addComment}
                          disabled={!newComment.trim() || submittingComment}
                          className="bg-blue-600 hover:bg-blue-700 shadow-sm rounded-full px-6"
                        >
                          {submittingComment ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1.5" />
                              Enviar Respuesta
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm text-gray-500 mt-4">
                      Este {settings.ticket_label.toLowerCase()} ha sido {selectedTicket.status.toLowerCase()} y el hilo de comentarios está cerrado.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchTickets}
      />
    </div>
  )
}