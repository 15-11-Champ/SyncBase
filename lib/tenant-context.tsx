'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain?: string;
    plan: string;
    status: string;
    settings?: Record<string, any>;
}

interface TenantContextType {
    currentTenant: Tenant | null;
    tenants: Tenant[];
    switchTenant: (tenantId: string) => Promise<void>;
    refreshTenants: () => Promise<void>;
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshTenants = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Guest mode resolution (from URL/Subdomain)
            const resolveGuestTenant = async () => {
                if (typeof window === 'undefined') return null;
                const url = new URL(window.location.href);
                const slug = url.searchParams.get('tenant');
                if (slug) {
                    const { data } = await supabase
                        .from('tenants')
                        .select('*')
                        .eq('slug', slug)
                        .eq('status', 'active')
                        .single();
                    return data as Tenant;
                }
                return null;
            };

            if (!user) {
                setTenants([]);
                const guestTenant = await resolveGuestTenant();
                setCurrentTenant(guestTenant);
                setIsLoading(false);
                return;
            }

            // Authenticated logic... (remains same)

            // Get all tenants user belongs to with a timeout/race
            const membershipPromise = supabase
                .from('tenant_members')
                .select(`
                    tenant_id,
                    role,
                    tenants (
                        id, name, slug, domain, plan, status, settings
                    )
                `)
                .eq('user_id', user.id)
                .eq('status', 'active');

            // Timeout after 5 seconds to prevent hanging the whole app
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Membership query timed out')), 5000)
            );

            const { data: memberships, error: memberError } = await Promise.race([
                membershipPromise,
                timeoutPromise
            ]) as any;

            if (memberError) {
                console.error('Tenant fetch error (likely recursion):', memberError.message);
                // Don't return, just continue with empty tenants so app doesn't hang
            }

            const userTenants = (memberships || [])
                .map((m: any) => m.tenants)
                .filter(Boolean) as Tenant[];

            setTenants(userTenants);

            // Get user's current tenant from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('current_tenant_id')
                .eq('id', user.id)
                .single();

            // Set current tenant
            if (profile?.current_tenant_id) {
                const tenant = userTenants.find(t => t.id === profile.current_tenant_id);
                setCurrentTenant(tenant || userTenants[0] || null);
            } else if (userTenants.length > 0) {
                // Default to first tenant and save it
                setCurrentTenant(userTenants[0]);
                await supabase
                    .from('profiles')
                    .update({ current_tenant_id: userTenants[0].id })
                    .eq('id', user.id);
            } else {
                setCurrentTenant(null);
            }
        } catch (error) {
            console.error('Error loading tenants:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const switchTenant = async (tenantId: string) => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (!tenant) return;

        setCurrentTenant(tenant);

        // Save to profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('profiles')
                .update({ current_tenant_id: tenantId })
                .eq('id', user.id);
        }

        // Store in localStorage for quick access
        if (typeof window !== 'undefined') {
            localStorage.setItem('current_tenant_id', tenantId);
        }
    };

    useEffect(() => {
        refreshTenants();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                refreshTenants();
            } else {
                setTenants([]);
                setCurrentTenant(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <TenantContext.Provider
            value={{
                currentTenant,
                tenants,
                switchTenant,
                refreshTenants,
                isLoading,
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
