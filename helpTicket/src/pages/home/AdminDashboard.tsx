import { ShieldCheck, Users, Activity, Settings, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-primary" /> Panel de Administración
        </h2>
        <p className="text-muted-foreground">Análisis global y estadísticas del sistema.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestión de Usuarios</div>
            <p className="text-xs text-muted-foreground mt-1">Administrar roles y perfiles</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Salud del Sistema</CardTitle>
            <Activity className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Óptimo</div>
            <p className="text-xs text-muted-foreground mt-1">Todos los servicios en línea</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Rendimiento (SLAs)</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground mt-1">Métricas de tiempo de respuesta</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimos eventos administrativos y del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500 border border-dashed rounded-lg bg-gray-50/50">
            <Settings className="w-10 h-10 text-gray-300 mb-3" />
            <p>El sistema se encuentra configurado y funcionando.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
