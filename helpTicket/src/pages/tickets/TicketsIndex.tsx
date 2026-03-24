import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"
import UserTickets from "./UserTickets"
import SupportTickets from "./SupportTickets"

export default function TicketsIndex() {
  const { profile, loading } = useAuth()

  if (loading) {
    return null // O un loader
  }

  if (profile?.role === 'user') {
    return <UserTickets />
  } else if (profile?.role === 'support') {
    return <SupportTickets />
  }

  // Si es admin, puede redirigir o mostrar vista de admin:
  return <Navigate to="/tickets/metricas" replace />
}
