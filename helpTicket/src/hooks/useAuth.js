import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Sesión activa al cargar la app
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session) fetchProfile(session)
            else setLoading(false)
        })

        // Escucha cambios: login, logout, refresh de token
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
                if (session) fetchProfile(session)
                else { setProfile(null); setLoading(false) }
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function fetchProfile(session) {
        const authUser = session.user;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
            
        // Extraemos claims inyectados por el hook JWT de Supabase
        let jwtAppMetadata = authUser.app_metadata || {};
        try {
            const base64Url = session.access_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jwtPayload = JSON.parse(decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')));
            if (jwtPayload.app_metadata) {
                jwtAppMetadata = jwtPayload.app_metadata;
            }
        } catch(e) { console.error("Error decoding JWT", e); }

        setProfile({
            ...data,
            role: jwtAppMetadata.role || 'user',
            organization_id: jwtAppMetadata.organization_id || null,
            is_super_admin: jwtAppMetadata.is_super_admin || false
        })
        setLoading(false)
    }

    async function login(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    async function logout() {
        await supabase.auth.signOut()
    }

    async function resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })
        if (error) throw error
    }

    return { user, profile, loading, login, logout, resetPassword }
}