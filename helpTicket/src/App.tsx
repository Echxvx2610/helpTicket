import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { App_Sidebar } from "@/components/layout/App_Sidebar"
import { App_Header } from "@/components/layout/App_Header"
import { Routes, Route } from "react-router-dom"
import Home from "@/pages/home/Home"
import Users from "@/pages/users/Users"
import Tickets from "@/pages/tickets/Tickets"
import Login from "@/pages/login/login"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Outlet } from "react-router-dom"

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
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/usuarios/gestion" element={<Users />} />
          <Route path="/tickets/metricas" element={<Tickets />} />
          <Route path="/tickets/analiticas" element={<Tickets />} />
        </Route>
      </Route>
    </Routes>
  )
}