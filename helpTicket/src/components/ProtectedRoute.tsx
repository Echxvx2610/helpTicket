import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, profile, loading } = useAuth()

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <span className="text-gray-400 text-sm">Cargando...</span>
        </div>
    )

    // Sin sesión → al login
    if (!user) return <Navigate to="/login" replace />

    // Con sesión pero rol no permitido → redirigir a su área
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        const redirects: Record<string, string> = {
            admin: '/admin/dashboard',
            support: '/support/dashboard',
            user: '/tickets'
        }
        return <Navigate to={redirects[profile.role] ?? '/login'} replace />
    }

    return <Outlet />
}