import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
    // 1. Manejo del Preflight Request (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error("Faltan variables de entorno en el servidor de Supabase.")
        }

        const supabaseClient = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Falta el token de autorización.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        
        const jwt = authHeader.replace('Bearer ', '')

        // Verificamos quién hace la petición
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser(jwt)

        if (!user || userError) {
            return new Response(JSON.stringify({ error: 'No autorizado o token vencido.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Cliente Admin para bypass de RLS y verificar membresía
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data: member, error: memberError } = await supabaseAdmin
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', user.id)
            .single()

        if (memberError || !member) {
            return new Response(JSON.stringify({ error: 'Permisos insuficientes. No se encontró su membresía.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const orgId = member.organization_id
        const adminRole = member.role

        if (adminRole !== 'admin') {
            return new Response(JSON.stringify({ error: 'Permisos insuficientes. Sólo un administrador puede modificar usuarios en su organización.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ELIMINAR USUARIO
        if (req.method === 'DELETE') {
            const { userId } = await req.json()
            if (!userId) throw new Error("ID de usuario requerido")

            // Eliminar de auth.users (esto hace cascade a public.profiles por el diseño de la BD)
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
            if (deleteError) throw deleteError

            return new Response(JSON.stringify({ message: 'Usuario eliminado exitosamente' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // ACTUALIZAR USUARIO
        if (req.method === 'PUT') {
            const { userId, full_name, role, status, password } = await req.json()
            if (!userId) throw new Error("ID de usuario requerido")

            // 1. Actualizar auth.users (Si hay password nueva)
            if (password && password.trim() !== '') {
                const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password: password
                })
                if (authError) throw authError
            }

            // 2. Actualizar public.profiles (solo full_name)
            if (full_name) {
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .update({ full_name: full_name })
                    .eq('id', userId)

                if (profileError) throw profileError
            }

            // 3. Actualizar public.organization_members (role, status)
            const memberProps: any = {}
            if (role) memberProps.role = role
            if (status) memberProps.status = status

            if (Object.keys(memberProps).length > 0) {
                const { error: updateError } = await supabaseAdmin
                    .from('organization_members')
                    .update(memberProps)
                    .eq('user_id', userId)
                    .eq('organization_id', orgId)

                if (updateError) throw updateError
            }

            return new Response(JSON.stringify({ message: 'Usuario actualizado exitosamente' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        throw new Error("Método HTTP no soportado")

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
