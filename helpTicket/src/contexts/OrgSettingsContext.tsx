import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/hooks/useAuth"

export interface OrgSettings {
  system_name: string
  support_role_label: string
  user_role_label: string
  operator_role_label: string
  ticket_label: string
  location_label: string
  created_by_label: string
  assigned_to_label: string
  ticket_categories: string[]
  ticket_priorities: string[]
  ticket_areas: string[]
  ticket_devices: string[]
}

export const DEFAULT_SETTINGS: OrgSettings = {
  system_name: "HelpTicket",
  support_role_label: "Soporte",
  user_role_label: "Usuario",
  operator_role_label: "Operador",
  ticket_label: "Ticket",
  location_label: "Ubicación",
  created_by_label: "Creado por",
  assigned_to_label: "Asignado a",
  ticket_categories: ["Hardware", "Software", "Red/Conectividad", "Cuenta/Acceso", "Otro"],
  ticket_priorities: ["Baja", "Media", "Alta", "Urgente"],
  ticket_areas: ["Administración", "Contabilidad", "Recursos Humanos", "Ventas", "Soporte Técnico", "Desarrollo", "Otro"],
  ticket_devices: ["Desktop", "Laptop", "Servidor", "Impresora", "Teléfono", "Tablet", "Red/Router", "Otro"],
}

interface OrgSettingsContextValue {
  settings: OrgSettings
  isLoading: boolean
  refreshSettings: () => Promise<void>
}

const OrgSettingsContext = createContext<OrgSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  refreshSettings: async () => {},
})

export function OrgSettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = useAuth()
  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)

  const refreshSettings = useCallback(async () => {
    if (!profile?.organization_id) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .maybeSingle()

      if (!error && data) {
        setSettings({
          system_name: data.system_name ?? DEFAULT_SETTINGS.system_name,
          support_role_label:
            data.support_role_label ?? DEFAULT_SETTINGS.support_role_label,
          user_role_label:
            data.user_role_label ?? DEFAULT_SETTINGS.user_role_label,
          operator_role_label:
            data.operator_role_label ?? DEFAULT_SETTINGS.operator_role_label,
          ticket_label: data.ticket_label ?? DEFAULT_SETTINGS.ticket_label,
          location_label:
            data.location_label ?? DEFAULT_SETTINGS.location_label,
          created_by_label:
            data.created_by_label ?? DEFAULT_SETTINGS.created_by_label,
          assigned_to_label:
            data.assigned_to_label ?? DEFAULT_SETTINGS.assigned_to_label,
          ticket_categories: data.ticket_categories ?? DEFAULT_SETTINGS.ticket_categories,
          ticket_priorities: data.ticket_priorities ?? DEFAULT_SETTINGS.ticket_priorities,
          ticket_areas: data.ticket_areas ?? DEFAULT_SETTINGS.ticket_areas,
          ticket_devices: data.ticket_devices ?? DEFAULT_SETTINGS.ticket_devices,
        })
      } else {
        setSettings(DEFAULT_SETTINGS)
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setIsLoading(false)
    }
  }, [profile?.organization_id])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  return (
    <OrgSettingsContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </OrgSettingsContext.Provider>
  )
}

export function useOrgSettings() {
  return useContext(OrgSettingsContext)
}
