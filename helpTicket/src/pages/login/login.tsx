import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { User, Lock, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { supabase } from "../../lib/supabaseClient"

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [resetEmail, setResetEmail] = useState("")
    const [error, setError] = useState("")
    const [resetMsg, setResetMsg] = useState("")
    const [loading, setLoading] = useState(false)
    const [resetLoading, setResetLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(false)

    const { login, resetPassword } = useAuth()
    const router = useNavigate()

    const handleLogin = async () => {
        setLoading(true)
        setError("")
        try {
            const data = await login(email, password)
            router('/')

        } catch (err) {
            setError("Usuario o contraseña incorrectos, por favor intenta de nuevo")
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        if (!resetEmail) return
        setResetLoading(true)
        setResetMsg("")

        try {
            await resetPassword(resetEmail)
            setResetMsg("Correo enviado, revisa tu bandeja de entrada.")
        } catch (err) {
            setResetMsg("No se pudo enviar el correo, verifica la dirección.")
        } finally {
            setResetLoading(false)
        }
    }

    // Permitir login con Enter
    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin()
    }

    return (
        <div className="relative h-screen w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-mauve-600" />

            <div className="relative flex items-center justify-center h-full px-4">
                <Card className="w-full max-w-sm border border-white/20 bg-white/80 backdrop-blur-xl shadow-xl animate-in fade-in zoom-in-95 duration-300">

                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <img src="helpticketicon.png" alt="logo" className="w-10 h-10" />
                            <span className="text-2xl font-bold">HelpTicket</span>
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-1">
                            <span className="text-gray-500 text-lg font-medium">Bienvenido de nuevo</span>
                            <span className="text-gray-500 font-small font-light">Inicia sesión para continuar</span>
                        </CardDescription>
                    </CardHeader>

                    {error && (
                        <Alert className="max-w-md mx-auto w-7/8 flex items-start gap-2 bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="h-5 w-5" />
                            <div>
                                <AlertTitle className="font-medium">Falló el inicio de sesión</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </div>
                        </Alert>
                    )}

                    <CardContent className="flex flex-col gap-4 pt-6">

                        {/* Email — Supabase usa email, no username */}
                        <Field className="flex flex-col gap-1">
                            <Label>Correo electrónico</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="correo@empresa.com"
                                    className="pl-10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </Field>

                        {/* Contraseña */}
                        <Field className="flex flex-col gap-1">
                            <Label>Contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="••••••••"
                                    className="pl-10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </Field>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-2">

                        <span
                            className="relative text-sm text-gray-400 cursor-pointer 
                            after:content-[''] after:absolute after:left-0 after:-bottom-0.5 
                            after:w-0 after:h-[2px] after:bg-primary 
                            after:transition-all after:duration-300 
                            hover:text-primary hover:after:w-full"
                            onClick={() => {
                                setShowDialog(true)
                                setResetMsg("")
                            }}
                        >
                            ¿Olvidaste tu contraseña?
                        </span>

                        {showDialog && (
                            <dialog open className="fixed inset-0 z-50 m-auto w-11/12 max-w-md p-6 rounded-lg border shadow-lg bg-white">
                                <p className="text-gray-700 text-center text-lg font-medium mb-2">Recupera tu contraseña</p>
                                <span className="text-gray-500 text-center font-light">
                                    Ingresa tu correo y te enviaremos un enlace para restablecerla.
                                </span>
                                <Input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="correo@empresa.com"
                                    className="text-center mt-4 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />

                                {/* Mensaje de éxito o error del reset */}
                                {resetMsg && (
                                    <p className={`text-sm text-center mt-2 ${resetMsg.includes("enviado") ? "text-green-600" : "text-red-500"}`}>
                                        {resetMsg}
                                    </p>
                                )}

                                <div className="mt-4 flex justify-between gap-2 w-full">
                                    <Button
                                        onClick={handleResetPassword}
                                        disabled={resetLoading || !resetEmail}
                                        className="w-1/2 rounded-lg font-medium shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
                                    >
                                        {resetLoading ? "Enviando..." : "Enviar"}
                                    </Button>
                                    <Button
                                        onClick={() => { setShowDialog(false); setResetEmail(""); setResetMsg("") }}
                                        className="w-1/2 rounded-lg font-medium shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </dialog>
                        )}

                        <Button
                            onClick={handleLogin}
                            disabled={loading || !email || !password}
                            className="w-full rounded-lg font-medium shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </Button>

                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}