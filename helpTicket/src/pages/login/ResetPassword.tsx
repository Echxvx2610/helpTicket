import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Loader2, CheckCircle2 } from "lucide-react"

export default function ResetPassword() {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        // Supabase procesa el hash de acceso en la URL (evento PASSWORD_RECOVERY).
        // Si el usuario no tiene sesión o el token es inválido, puede rebotar. 
        const checkSession = async () => {
             const { data } = await supabase.auth.getSession()
             if (!data.session) {
                 // Podríamos redirigir o mostrar un error temporalmente
                 // navigate('/login')
             }
        }
        checkSession()
    }, [])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password.length < 6) {
             setError("La contraseña debe tener al menos 6 caracteres.")
             return
        }
        setLoading(true)
        setError("")
        try {
             const { error } = await supabase.auth.updateUser({ password })
             if (error) throw error
             setSuccess(true)
             setTimeout(() => {
                 navigate('/')
             }, 3000)
        } catch(err: any) {
             setError(err.message)
        } finally {
             setLoading(false)
        }
    }

    return (
        <div className="relative h-screen w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-mauve-600" />
            <div className="relative flex items-center justify-center h-full px-4">
                <Card className="w-full max-w-sm border border-white/20 bg-white/90 backdrop-blur-xl shadow-xl animate-in fade-in zoom-in-95 duration-300">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
                        <CardDescription>
                            Ingresa tu nueva contraseña para acceder a tu cuenta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                             <div className="flex flex-col items-center justify-center gap-3 py-6 text-green-600">
                                  <CheckCircle2 className="w-12 h-12" />
                                  <p className="font-medium text-center">¡Contraseña actualizada!</p>
                                  <p className="text-sm text-center text-gray-500">Redirigiendo a tu cuenta...</p>
                             </div>
                        ) : (
                             <form onSubmit={handleReset} className="flex flex-col gap-4">
                                <div className="space-y-1">
                                    <Label>Contraseña</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                                {error && (
                                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
                                )}
                                <Button
                                    type="submit"
                                    disabled={loading || !password}
                                    className="w-full mt-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {loading ? "Guardando..." : "Guardar contraseña"}
                                </Button>
                             </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
