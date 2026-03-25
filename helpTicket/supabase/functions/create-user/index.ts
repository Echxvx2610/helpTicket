import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve(async (req) => {
    // 1. Manejo del Preflight Request (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
             throw new Error("Faltan variables de entorno en el servidor de Supabase.")
        }

        const supabaseClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const authHeader = req.headers.get('Authorization')
        console.log('Auth header:', authHeader)
        
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Falta el token de autorización.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        
        const jwt = authHeader.replace('Bearer ', '')
        console.log('JWT:', jwt.substring(0, 50) + '...')

        // Verificamos quién hace la petición
        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser(jwt)
        
        console.log('User:', user)
        console.log('User error:', userError)

        // Validamos si es Admin leyendo el token (multitenancy)
        if (!user || userError) {
            return new Response(JSON.stringify({ error: 'No autorizado o token vencido: ' + userError?.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Cliente con Service Role Key para poder crear un auth.user y leer BD
        const supabaseAdmin = createClient(
            supabaseUrl,
            serviceRoleKey
        )

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
            return new Response(JSON.stringify({ error: 'Permisos insuficientes. Sólo un administrador puede crear usuarios en su organización.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { email, password, full_name, role } = await req.json()

        if (!email || !password || !full_name || !role) {
            return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name } // El trigger usará esto para el full_name
        })

        if (createError) {
            throw createError
        }

        // Asociar el usuario a la organización del administrador en organization_members
        const { error: insertError } = await supabaseAdmin
            .from('organization_members')
            .insert({
                organization_id: orgId,
                user_id: newUser.user.id,
                role: role,
                status: 'active'
            })
            
        if (insertError) {
            throw insertError
        }

        return new Response(JSON.stringify({ user: newUser.user, message: 'Usuario creado exitosamente' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
