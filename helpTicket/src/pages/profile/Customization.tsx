import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  useOrgSettings,
  DEFAULT_SETTINGS,
  type OrgSettings,
} from "@/contexts/OrgSettingsContext"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Palette, RotateCcw, Save, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "sistema" | "roles" | "tickets"

const TABS: { id: Tab; label: string }[] = [
  { id: "sistema", label: "Sistema" },
  { id: "roles", label: "Roles" },
  { id: "tickets", label: "Tickets" },
]

interface FieldRowProps {
  label: string
  description: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

interface ArrayRowProps {
  label: string
  description: string
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}

function ArrayRow({ label, description, value, onChange, placeholder }: ArrayRowProps) {
  const [localVal, setLocalVal] = useState(value.join(', '))
  
  useEffect(() => {
    setLocalVal(value.join(', '))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalVal(e.target.value)
    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
    onChange(arr)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="sm:w-56">
        <Textarea
          value={localVal}
          onChange={handleChange}
          placeholder={placeholder}
          className="text-sm min-h-[80px]"
        />
      </div>
    </div>
  )
}

function FieldRow({ label, description, value, onChange, placeholder }: FieldRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="sm:w-56">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
        />
      </div>
    </div>
  )
}

export default function Customization() {
  const { profile } = useAuth()
  const { settings, refreshSettings } = useOrgSettings()
  const [activeTab, setActiveTab] = useState<Tab>("sistema")
  const [form, setForm] = useState<OrgSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: "", text: "" })

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const update = <K extends keyof OrgSettings>(key: K) => (value: OrgSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!profile?.organization_id) return
    setSaving(true)
    setMsg({ type: "", text: "" })
    try {
      const { error } = await supabase.from("organization_settings").upsert(
        {
          organization_id: profile.organization_id,
          ...form,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" }
      )
      if (error) throw error
      await refreshSettings()
      setMsg({ type: "success", text: "Configuración guardada correctamente." })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido"
      setMsg({ type: "error", text: message })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setForm(DEFAULT_SETTINGS)
    setMsg({ type: "", text: "" })
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
          <Palette className="w-8 h-8 text-primary" /> Personalización
        </h2>
        <p className="text-muted-foreground mt-1">
          Adapta la terminología del sistema al contexto de tu organización.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form panel */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Tab buttons */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg self-start">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="pt-4 pb-2">
              {/* Tab: Sistema */}
              {activeTab === "sistema" && (
                <div>
                  <FieldRow
                    label="Nombre del Sistema"
                    description="Se muestra en la barra lateral y encabezados principales."
                    value={form.system_name}
                    onChange={update("system_name")}
                    placeholder="HelpTicket"
                  />
                </div>
              )}

              {/* Tab: Roles */}
              {activeTab === "roles" && (
                <div>
                  <FieldRow
                    label="Etiqueta de Soporte"
                    description="Rol que atiende los tickets (ej: Ingeniería, Mantenimiento)."
                    value={form.support_role_label}
                    onChange={update("support_role_label")}
                    placeholder="Soporte"
                  />
                  <FieldRow
                    label="Etiqueta de Operador"
                    description="Rol especializado de operación (ej: Operador, Técnico)."
                    value={form.operator_role_label}
                    onChange={update("operator_role_label")}
                    placeholder="Operador"
                  />
                  <FieldRow
                    label="Etiqueta de Usuario"
                    description="Rol base del sistema (ej: Usuario, Solicitante)."
                    value={form.user_role_label}
                    onChange={update("user_role_label")}
                    placeholder="Usuario"
                  />
                </div>
              )}

              {/* Tab: Tickets */}
              {activeTab === "tickets" && (
                <div>
                  <FieldRow
                    label="Etiqueta de Ticket"
                    description="Cómo se denomina una solicitud (ej: Ticket, OT, Incidencia)."
                    value={form.ticket_label}
                    onChange={update("ticket_label")}
                    placeholder="Ticket"
                  />
                  <FieldRow
                    label="Etiqueta de Ubicación"
                    description="Campo de lugar del ticket (ej: Línea de Producción, Área, Planta)."
                    value={form.location_label}
                    onChange={update("location_label")}
                    placeholder="Ubicación"
                  />
                  <FieldRow
                    label="Etiqueta 'Creado por'"
                    description="Quién abre el ticket (ej: Solicitante, Reportado por)."
                    value={form.created_by_label}
                    onChange={update("created_by_label")}
                    placeholder="Creado por"
                  />
                  <FieldRow
                    label="Etiqueta 'Asignado a'"
                    description="Quién atiende el ticket (ej: Responsable, Técnico)."
                    value={form.assigned_to_label}
                    onChange={update("assigned_to_label")}
                    placeholder="Asignado a"
                  />
                  <ArrayRow
                    label="Categorías de Tickets"
                    description="Opciones para el campo Categoría (separadas por coma)."
                    value={form.ticket_categories}
                    onChange={(arr) => setForm(prev => ({ ...prev, ticket_categories: arr }))}
                    placeholder="Hardware, Software..."
                  />
                  <ArrayRow
                    label="Prioridades"
                    description="Opciones de Prioridad (separadas por coma)."
                    value={form.ticket_priorities}
                    onChange={(arr) => setForm(prev => ({ ...prev, ticket_priorities: arr }))}
                    placeholder="Baja, Media, Alta..."
                  />
                  <ArrayRow
                    label="Áreas / Ubicaciones"
                    description="Opciones de áreas disponibles (separadas por coma)."
                    value={form.ticket_areas}
                    onChange={(arr) => setForm(prev => ({ ...prev, ticket_areas: arr }))}
                    placeholder="Administración, Ventas..."
                  />
                  <ArrayRow
                    label="Dispositivos"
                    description="Opciones de dispositivos (separadas por coma)."
                    value={form.ticket_devices}
                    onChange={(arr) => setForm(prev => ({ ...prev, ticket_devices: arr }))}
                    placeholder="Desktop, Laptop..."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback message */}
          {msg.text && (
            <div
              className={cn(
                "p-3 rounded-lg text-sm",
                msg.type === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              )}
            >
              {msg.text}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Restaurar Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Live Preview panel */}
        <div className="lg:w-72">
          <Card className="sticky top-4 shadow-sm border-gray-100 bg-gradient-to-br from-gray-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-600">
                <Eye className="w-4 h-4" /> Vista Previa
              </CardTitle>
              <CardDescription className="text-xs">
                Así se verá la terminología en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                <p className="font-bold text-gray-800 text-base">{form.system_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Nombre del sistema</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: form.support_role_label, color: "bg-blue-100 text-blue-700" },
                  { label: form.operator_role_label, color: "bg-purple-100 text-purple-700" },
                  { label: form.user_role_label, color: "bg-gray-100 text-gray-700" },
                ].map((role) => (
                  <span
                    key={role.label}
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium text-center truncate",
                      role.color
                    )}
                  >
                    {role.label}
                  </span>
                ))}
              </div>

              <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{form.ticket_label} #0042</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Abierto</span>
                </div>
                <p className="text-xs font-medium text-gray-700 truncate">Falla en sensor de temperatura</p>
                <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                  <p><span className="font-medium">{form.location_label}:</span> Línea 3 - Área B</p>
                  <p><span className="font-medium">{form.created_by_label}:</span> J. Ramírez</p>
                  <p><span className="font-medium">{form.assigned_to_label}:</span> Ing. García</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
