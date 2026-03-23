import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { App_Sidebar } from "@/components/layout/App_Sidebar"
import { App_Header } from "@/components/layout/App_Header"
import { Routes, Route } from "react-router-dom"
import Home from "@/pages/home/Home"
import Users from "@/pages/users/Users"
import Tickets from "@/pages/tickets/Tickets"
import Login from "@/pages/login/login"
import ResetPassword from "@/pages/login/ResetPassword"
import Profile from "@/pages/profile/Profile"
import Billing from "@/pages/billing/Billing"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Outlet, Navigate } from "react-router-dom"

function RootLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <App_Sidebar />
        <div className="flex flex-col w-full min-h-screen">
          <App_Header />
          <main className="flex-1 p-4 w-full">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Rutas protegidas — cualquier usuario autenticado */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RootLayout />}>

          {/* Todos los roles */}
          <Route path="/" element={<Home />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/tickets/metricas" element={<Tickets />} />
          <Route path="/tickets/analiticas" element={<Tickets />} />

          {/* Solo admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/usuarios/gestion" element={<Users />} />
            <Route path="/billing" element={<Billing />} />
          </Route>

        </Route>
      </Route>

      {/* Cualquier ruta desconocida → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}