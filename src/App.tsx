import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarProvider } from "@/components/ui/sidebar"
import { App_Sidebar } from "@/components/layout/App_Sidebar"
import { App_Header } from "@/components/layout/App_Header"
import { Routes, Route } from "react-router-dom"
import Home from "@/pages/home/Home"
import Users from "@/pages/users/Users"
import Tickets from "@/pages/tickets/Tickets"

export default function RootLayout({ children }: { children?: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <App_Sidebar />
        <div className="flex flex-col w-full min-h-screen">
          <App_Header />
          <main className="flex-1 p-4 w-full">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/usuarios/gestion" element={<Users />} />
              <Route path="/tickets/metricas" element={<Tickets />} />
              <Route path="/tickets/analiticas" element={<Tickets />} />
            </Routes>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}