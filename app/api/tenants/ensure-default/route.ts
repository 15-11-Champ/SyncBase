import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Ensures the current user has at least one tenant (creates a default if none).
 * Use for users created before the per-user tenant trigger, or if the trigger failed.
 */
export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        )
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: existing } = await supabase
            .from('tenant_members')
            .select('tenant_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)

        if (existing && existing.length > 0) {
            return NextResponse.json({ ensured: true, hadTenant: true })
        }

        const slug = 'org-' + user.id.replace(/-/g, '')
        const name = (user.user_metadata?.business_name as string) || (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'My Organization'

        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                name: name.trim() || 'My Organization',
                slug,
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
            await supabase.from('tenants').delete().eq('id', tenant.id)
            return NextResponse.json({ error: memberError.message }, { status: 500 })
        }

        await supabase
            .from('profiles')
            .upsert(
                {
                    id: user.id,
                    full_name: (user.user_metadata?.full_name as string) || user.email ?? undefined,
                    current_tenant_id: tenant.id,
                },
                { onConflict: 'id' }
            )

        return NextResponse.json({ ensured: true, tenant })
    } catch (err: unknown) {
        console.error('Ensure default tenant error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
