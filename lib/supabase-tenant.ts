import { supabase } from '@/lib/supabaseClient'

/**
 * Execute a Supabase operation with a specific tenant context.
 * Sets the tenant_id session variable before running the callback,
 * so RLS policies filter data automatically.
 */
export async function withTenantContext<T>(
    tenantId: string,
    callback: (client: typeof supabase) => Promise<T>
): Promise<T> {
    // Set tenant context for this session
    await supabase.rpc('set_tenant', { tenant_id: tenantId })

    // Execute the query
    return callback(supabase)
}

/**
 * Sets the tenant context on the current Supabase session.
 * Call this before making any tenant-scoped queries.
 */
export async function setTenantContext(tenantId: string) {
    const { error } = await supabase.rpc('set_tenant', { tenant_id: tenantId })
    if (error) {
        console.error('Failed to set tenant context:', error)
        throw error
    }
}

/**
 * Verify that the current user has access to the specified tenant.
 * Returns the membership role or null if no access.
 */
export async function verifyTenantAccess(
    tenantId: string,
    userId: string
): Promise<string | null> {
    const { data, error } = await supabase
        .from('tenant_members')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

    if (error || !data) return null
    return data.role
}
