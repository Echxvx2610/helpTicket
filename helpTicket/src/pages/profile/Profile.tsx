import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, User, KeyRound } from "lucide-react"

export default function Profile() {
    const { user, profile, loading } = useAuth()
    const [fullName, setFullName] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [processingProfile, setProcessingProfile] = useState(false)
    const [processingPassword, setProcessingPassword] = useState(false)
    const [msg, setMsg] = useState({ type: "", text: "" })
    const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" })

    useEffect(() => {
        if (profile) setFullName(profile.full_name || "")
    }, [profile])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setProcessingProfile(true)
        setMsg({ type: "", text: "" })
        try {
            if (!user) throw new Error("No hay sesión activa.")
            const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
            if (error) throw error
            setMsg({ type: "success", text: "Perfil actualizado correctamente." })
        } catch (error: any) {
            setMsg({ type: "error", text: error.message })
        } finally {
            setProcessingProfile(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 6) {
             setPwdMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." })
             return
        }
        setProcessingPassword(true)
        setPwdMsg({ type: "", text: "" })
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            setPwdMsg({ type: "success", text: "Contraseña actualizada correctamente." })
            setNewPassword("")
        } catch (error: any) {
            setPwdMsg({ type: "error", text: error.message })
        } finally {
            setProcessingPassword(false)
        }
    }

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center text-muted-foreground"><Loader2 className="animate-spin w-8 h-8" /></div>
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-800">Mi Perfil</h2>
                <p className="text-muted-foreground">Administra tu información personal y de seguridad.</p>
            </div>

            <Card className="shadow-sm border-gray-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Datos Personales</CardTitle>
                    <CardDescription>Actualiza tu nombre y cómo te ven otros usuarios.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre Completo</Label>
                            <Input 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                                placeholder="Tu nombre" 
                                required 
                            />
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label>Correo Electrónico</Label>
                            <Input value={profile?.email || ""} disabled className="bg-gray-50 text-gray-500" />
                            <p className="text-xs text-muted-foreground">El correo electrónico no puede ser modificado por seguridad.</p>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label>Rol del Sistema</Label>
                            <Input value={profile?.role || ""} disabled className="bg-gray-50 text-gray-500 uppercase font-medium" />
                        </div>

                        {msg.text && (
                            <div className={`p-3 rounded-lg text-sm mt-4 ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {msg.text}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={processingProfile}>
                                {processingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Cambiar Contraseña</CardTitle>
                    <CardDescription>Asegúrate de usar una contraseña segura.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nueva Contraseña</Label>
                            <Input 
                                type="password"
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                placeholder="••••••••" 
                                required 
                            />
                        </div>
                        
                        {pwdMsg.text && (
                            <div className={`p-3 rounded-lg text-sm mt-4 ${pwdMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                {pwdMsg.text}
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" variant="secondary" disabled={processingPassword || !newPassword}>
                                {processingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Actualizar Contraseña
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
