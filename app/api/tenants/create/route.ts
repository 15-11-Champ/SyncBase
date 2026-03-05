import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    try {
        // Get auth header
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get the user from the token
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, slug } = await request.json()

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })
        }

        const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')

        // Create tenant
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                name,
                slug: cleanSlug,
                plan: 'free',
                status: 'active',
            })
            .select()
            .single()

        if (tenantError) {
            if (tenantError.code === '23505') {
                return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
            }
            return NextResponse.json({ error: tenantError.message }, { status: 500 })
        }

        // Add user as owner
        const { error: memberError } = await supabase
            .from('tenant_members')
            .insert({
                tenant_id: tenant.id,
                user_id: user.id,
                role: 'owner',
                status: 'active',
                joined_at: new Date().toISOString(),
            })

        if (memberError) {
            // Rollback tenant creation
            await supabase.from('tenants').delete().eq('id', tenant.id)
            return NextResponse.json({ error: memberError.message }, { status: 500 })
        }

        // Set as current tenant in profile
        await supabase
            .from('profiles')
            .update({ current_tenant_id: tenant.id })
            .eq('id', user.id)

        return NextResponse.json({ tenant })
    } catch (err: any) {
        console.error('Tenant creation error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
