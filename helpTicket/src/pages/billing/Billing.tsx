import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, ExternalLink, CalendarDays, DollarSign } from "lucide-react"

export default function Billing() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-800">Gestión de Planes</h2>
        <p className="text-muted-foreground">Revisa tu historial de pagos, el monto de tu membresía y la fecha de renovación.</p>
      </div>

      {/* Resumen del Plan */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            HelpTicket Estándar <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full uppercase tracking-wider">Activo</span>
          </CardTitle>
          <CardDescription className="mt-1">Licencia de uso del sistema SaaS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2 text-gray-500 text-sm font-medium uppercase tracking-wider">
                 <DollarSign className="w-4 h-4" /> Monto a pagar
               </div>
               <span className="text-3xl font-bold text-gray-800">$49.00 <span className="text-base font-normal text-gray-500">USD/mes</span></span>
             </div>
             
             <div className="hidden md:block w-px h-12 bg-gray-200"></div>

             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-2 text-gray-500 text-sm font-medium uppercase tracking-wider">
                 <CalendarDays className="w-4 h-4" /> Próxima Renovación
               </div>
               <span className="text-2xl font-medium text-gray-800">15 de Abril, 2026</span>
             </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-6 px-6">
          <Button className="w-full sm:w-auto text-md font-medium h-11 px-8 shadow">Renovar Plan</Button>
        </CardFooter>
      </Card>

      {/* Historial de Facturas */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-gray-500" /> Historial de Pagos
          </CardTitle>
          <CardDescription>Resumen de tus últimos pagos realizados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha de Cobro</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Recibo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">15 de Marzo, 2026</td>
                  <td className="px-4 py-3 text-gray-600">$49.00 USD</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Pagado exitosamente</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">15 de Febrero, 2026</td>
                  <td className="px-4 py-3 text-gray-600">$49.00 USD</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Pagado exitosamente</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
                <tr className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">15 de Enero, 2026</td>
                  <td className="px-4 py-3 text-gray-600">$49.00 USD</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Pagado exitosamente</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
