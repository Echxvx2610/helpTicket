import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Sesión activa al cargar la app
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) fetchProfile(session.user.id)
            else setLoading(false)
        })

        // Escucha cambios: login, logout, refresh de token
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
                if (session?.user) fetchProfile(session.user.id)
                else { setProfile(null); setLoading(false) }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(userId: string) {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        setProfile(data)
        setLoading(false)
    }

    async function login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    async function logout() {
        await supabase.auth.signOut()
    }

    async function resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })
        if (error) throw error
    }

    return { user, profile, loading, login, logout, resetPassword }
}
