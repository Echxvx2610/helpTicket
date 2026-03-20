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
import { Separator } from "@/components/ui/separator"
import { User, Lock, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useState } from "react"
import { useNavigate } from "react-router-dom"



export default function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(false)
    const router = useNavigate()

    const handleLogin = () => {
        setLoading(true)
        setError("")

        if (username === "admin" && password === "admin") {
            localStorage.setItem("token", "dummy-token")
            router("/")
        } else {
            setError("Usuario o contraseña incorrectos, por favor intenta de nuevo")
        }

        setLoading(false)
    }

    return (
        <div className="relative h-screen w-full">
            {/* Fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-mauve-600" />

            {/* Contenido */}
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
                                <AlertTitle className="font-medium">Fallo el inicio de sesión</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </div>
                        </Alert>
                    )}

                    <CardContent className="flex flex-col gap-4 pt-6">

                        {/* Usuario */}
                        <Field className="flex flex-col gap-1">
                            <Label>Usuario</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Usuario"
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
                                    placeholder="Contraseña"
                                    className="pl-10 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </Field>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 pt-2">

                        {/* Link animado */}
                        <span
                            className="relative text-sm text-gray-400 cursor-pointer 
                            after:content-[''] after:absolute after:left-0 after:-bottom-0.5 
                            after:w-0 after:h-[2px] after:bg-primary 
                            after:transition-all after:duration-300 
                            hover:text-primary hover:after:w-full"
                            onClick={() => {
                                setShowDialog(true)
                            }}
                        >
                            ¿Olvidaste tu contraseña?
                        </span>
                        {showDialog && (
                            <dialog open className="fixed inset-0 z-50 m-auto w-11/12 max-w-md p-6 rounded-lg border shadow-lg bg-white">
                                <p className="text-gray-700 text-center text-lg font-medium mb-2">Recupera tu contraseña</p>
                                <span className="text-gray-500 text-center font-light">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</span>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Correo electrónico"
                                    className="text-center mt-4 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                <span className="text-gray-500 text-center font-light mt-2">Aun tienes problemas? Contacta a soporte técnico: [EMAIL_ADDRESS]</span>
                                <div className="mt-4 flex justify-between gap-2 w-full">
                                    <Button onClick={() => setShowDialog(false)} className="w-1/2 rounded-lg font-medium shadow-md hover:shadow-lg hover:scale-[1.01] transition-all">
                                        Enviar
                                    </Button>
                                    <Button onClick={() => setShowDialog(false)} className="w-1/2 rounded-lg font-medium shadow-md hover:shadow-lg hover:scale-[1.01] transition-all">
                                        Cancelar
                                    </Button>
                                </div>
                            </dialog>
                        )}

                        {/* Botón */}
                        <Button onClick={handleLogin} className="w-full rounded-lg font-medium shadow-md hover:shadow-lg hover:scale-[1.01] transition-all">
                            <Lock className="mr-2 h-4 w-4" />
                            Iniciar Sesión
                        </Button>

                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}