import { Users } from "lucide-react"

export default function UsersPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Users className="size-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Gestión de Usuarios</h2>
      <p className="text-muted-foreground max-w-sm">Administra los roles, permisos y detalles de los usuarios del sistema aquí.</p>
    </div>
  )
}
