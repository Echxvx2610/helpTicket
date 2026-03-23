import { useAuth } from "@/hooks/useAuth"
import UserDashboard from "./UserDashboard"
import SupportDashboard from "./SupportDashboard"
import AdminDashboard from "./AdminDashboard"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Renderizamos la vista correspondiente según el rol
  if (profile?.role === 'admin') {
    return <AdminDashboard />
  } else if (profile?.role === 'support') {
    return <SupportDashboard />
  }

  // Por defecto (user o rol no encontrado)
  return <UserDashboard />
}
