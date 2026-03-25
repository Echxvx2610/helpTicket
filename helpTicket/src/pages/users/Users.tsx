import { useEffect, useState } from "react"
import { Users, Plus, Shield, User, Loader2, RefreshCcw, Pencil, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"
import { useOrgSettings } from "@/contexts/OrgSettingsContext"

interface Profile {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'support' | 'user'
  status: 'active' | 'inactive'
  created_at: string
}

export default function UsersPage() {
  const { profile } = useAuth()
  const { settings } = useOrgSettings()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // States Modal Edit
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  // States Modal Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null)

  // Filters State
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Formularios Create User
  const [newFullname, setNewFullname] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<'admin' | 'support' | 'user'>('user')
  const [newPassword, setNewPassword] = useState("")

  // Formularios Update User
  const [editFullname, setEditFullname] = useState("")
  const [editRole, setEditRole] = useState<'admin' | 'support' | 'user'>('user')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active')
  const [editPassword, setEditPassword] = useState("") // opcional

  const [processing, setProcessing] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState({ type: "", text: "" }) // Fetch usuarios de la organización
  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        role,
        status,
        created_at,
        user_id,
        profiles (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
    
    if (data && !error) {
      // Map data to match existing Profile interface
      const formattedUsers = (data as any[]).map(member => ({
        id: member.user_id,
        full_name: member.profiles?.full_name,
        email: member.profiles?.email,
        avatar_url: member.profiles?.avatar_url,
        role: member.role,
        status: member.status,
        created_at: member.created_at
      }))
      
      setUsers(formattedUsers as Profile[])
    } else {
      console.error("Error al cargar usuarios de la organización:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setFeedbackMsg({ type: "", text: "" })

    try {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Session:', session)
      console.log('Session Error:', sessionError)
      console.log('Access Token:', session?.access_token?.substring(0, 20) + '...')
      
      if (!session || sessionError) {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        session = refreshedSession
        sessionError = refreshError
        console.log('Refreshed Session:', session)
        console.log('Refresh Error:', refreshError)
      }
      
      if (sessionError || !session?.access_token) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.")
      }

      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newEmail,
          password: newPassword,
          full_name: newFullname,
          role: newRole,
          organization_id: profile?.organization_id
        }
      })

      if (error) throw error

      setFeedbackMsg({ type: "success", text: "Usuario creado exitosamente" })
      setNewFullname("")
      setNewEmail("")
      setNewPassword("")
      setNewRole("user")
      fetchUsers()

      setTimeout(() => {
        setShowCreateDialog(false)
        setFeedbackMsg({ type: "", text: "" })
      }, 1500)

    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message })
    } finally {
      setProcessing(false)
    }
  }

  const openEditModal = (u: Profile) => {
    setEditingUser(u)
    setEditFullname(u.full_name || "")
    setEditRole(u.role)
    setEditStatus(u.status)
    setEditPassword("")
    setFeedbackMsg({ type: "", text: "" })
    setShowEditDialog(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setProcessing(true)
    setFeedbackMsg({ type: "", text: "" })

    try {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session || sessionError) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
        session = refreshedSession
      }
      
      if (!session?.access_token) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.")
      }

      const { error } = await supabase.functions.invoke('manage-user', {
        method: "PUT",
        body: {
          userId: editingUser.id,
          full_name: editFullname,
          role: editRole,
          status: editStatus,
          password: editPassword
        }
      })

      if (error) throw error

      setFeedbackMsg({ type: "success", text: "Usuario actualizado exitosamente" })
      fetchUsers()

      setTimeout(() => {
        setShowEditDialog(false)
        setFeedbackMsg({ type: "", text: "" })
      }, 1500)

    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message })
    } finally {
      setProcessing(false)
    }
  }

  const openDeleteModal = (u: Profile) => {
    setDeletingUser(u)
    setFeedbackMsg({ type: "", text: "" })
    setShowDeleteDialog(true)
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return
    setProcessing(true)
    setFeedbackMsg({ type: "", text: "" })

    try {
      let { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (!session || sessionError) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
        session = refreshedSession
      }
      
      if (!session?.access_token) {
        throw new Error("No hay sesión activa. Por favor, inicia sesión nuevamente.")
      }

      const { error } = await supabase.functions.invoke('manage-user', {
        method: "DELETE",
        body: {
          userId: deletingUser.id
        }
      })

      if (error) throw error

      setFeedbackMsg({ type: "success", text: "Usuario eliminado" })
      fetchUsers()

      setTimeout(() => {
        setShowDeleteDialog(false)
        setFeedbackMsg({ type: "", text: "" })
      }, 1500)

    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message })
    } finally {
      setProcessing(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (u.full_name?.toLowerCase() || "").includes(term) ||
      (u.email?.toLowerCase() || "").includes(term)

    const matchesRole = filterRole === "all" || u.role === filterRole
    const matchesStatus = filterStatus === "all" || u.status === filterStatus

    return matchesSearch && matchesRole && matchesStatus
  })

  return (
    <div className="flex h-full flex-col gap-6 p-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-800">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">Administra los roles y perfiles del sistema.</p>
        </div>
        <Button onClick={() => { setFeedbackMsg({ type: "", text: "" }); setShowCreateDialog(true) }} className="rounded-lg shadow-sm hover:shadow-md transition-all gap-2">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </Button>
      </div>

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 border-b border-gray-100 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar por nombre o correo..."
                className="pl-9 bg-gray-50/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                title="Filtrar por rol"
                className="flex h-10 w-full rounded-md border border-input bg-gray-50/50 px-3 py-2 text-sm ring-offset-background outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="support">{settings.support_role_label}</option>
                <option value="user">{settings.operator_role_label || settings.user_role_label}</option>
              </select>

              <select
                title="Filtrar por estado"
                className="flex h-10 w-full rounded-md border border-input bg-gray-50/50 px-3 py-2 text-sm ring-offset-background outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>

              <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading} title="Actualizar lista" className="shrink-0 bg-gray-50/50">
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[calc(100vh-18rem)] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-medium">Nombre</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Rol</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium">Fecha</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Cargando usuarios...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No se encontraron usuarios que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                            {u.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                          </div>
                          <span className="truncate max-w-[150px]">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-[180px]"><span className="truncate block">{u.email}</span></td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1
                          ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'support' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {u.role === 'admin' ? 'Administrador' : u.role === 'support' ? settings.support_role_label : (settings.operator_role_label || settings.user_role_label)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(u)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteModal(u)} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter>
          <span className="text-sm text-gray-500">Total de usuarios: {filteredUsers.length}</span>
        </CardFooter>
      </Card>

      {/* Modal Crear Usuario */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <dialog open className="relative m-auto w-full max-w-md p-0 rounded-xl border-none shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Crear Usuario
              </h3>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input required value={newFullname} onChange={e => setNewFullname(e.target.value)} placeholder="Ej. Juan Pérez" />
              </div>

              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="correo@empresa.com" />
              </div>

              <div className="space-y-2">
                <Label>Contraseña Inicial</Label>
                <Input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <div className="space-y-2">
                <Label>Rol del Sistema</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                >
                  <option value="user">{settings.operator_role_label || settings.user_role_label}</option>
                  <option value="support">{settings.support_role_label}</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {feedbackMsg.text && (
                <div className={`p-3 rounded-lg text-sm ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {feedbackMsg.text}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={processing} className="min-w-[120px]">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
                </Button>
              </div>
            </form>
          </dialog>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditDialog && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <dialog open className="relative m-auto w-full max-w-md p-0 rounded-xl border-none shadow-2xl bg-white overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" /> Editar Usuario
              </h3>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input required value={editFullname} onChange={e => setEditFullname(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input disabled value={editingUser.email} className="bg-gray-100 text-gray-500" />
                <p className="text-xs text-muted-foreground">El correo no de puede editar por seguridad.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol del Sistema</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as any)}
                  >
                    <option value="user">{settings.operator_role_label || settings.user_role_label}</option>
                    <option value="support">{settings.support_role_label}</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Estado de Cuenta</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Label>Nueva Contraseña (Opcional)</Label>
                <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" />
              </div>

              {feedbackMsg.text && (
                <div className={`p-3 rounded-lg text-sm ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {feedbackMsg.text}
                </div>
              )}

              <div className="flex gap-3 justify-end mt-6">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={processing} className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </dialog>
        </div>
      )}

      {/* Modal Eliminar Usuario */}
      {showDeleteDialog && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <dialog open className="relative m-auto w-full max-w-sm p-6 rounded-xl border-none shadow-2xl bg-white text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Eliminar Cuenta</h3>
            <p className="text-sm text-gray-500 mb-6">
              ¿Estás seguro que deseas eliminar a <strong>{deletingUser.full_name}</strong>? Esta acción es irreversible y eliminará todos sus datos.
            </p>

            {feedbackMsg.text && (
              <div className={`p-3 mb-4 rounded-lg text-sm ${feedbackMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {feedbackMsg.text}
              </div>
            )}

            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={processing}>
                Cancelar
              </Button>
              <Button onClick={handleDeleteUser} disabled={processing} className="bg-red-600 hover:bg-red-700 text-white">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, Eliminar"}
              </Button>
            </div>
          </dialog>
        </div>
      )}

    </div>
  )
}
