'use client';

import { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';

export default function TenantSwitcher() {
    const { currentTenant, tenants, switchTenant, isLoading } = useTenant();
    const [open, setOpen] = useState(false);

    if (isLoading || !currentTenant) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100/50 rounded-lg">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Loading...</span>
            </div>
        );
    }

    // If only one tenant, show it without dropdown
    if (tenants.length <= 1) {
        return (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg">
                <Building2 className="h-4 w-4 text-gray-600" />
                <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                        {currentTenant.name}
                    </p>
                    <p className="text-[10px] text-gray-500 capitalize">{currentTenant.plan}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-2"
            >
                <div className="flex items-center space-x-2 min-w-0">
                    <Building2 className="h-4 w-4 text-gray-600 shrink-0" />
                    <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {currentTenant.name}
                        </p>
                        <p className="text-[10px] text-gray-500 capitalize">{currentTenant.plan}</p>
                    </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        <div className="py-1 max-h-60 overflow-auto">
                            {tenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    onClick={() => {
                                        switchTenant(tenant.id);
                                        setOpen(false);
                                    }}
                                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-2 min-w-0">
                                        <Building2 className="h-4 w-4 text-gray-600 shrink-0" />
                                        <div className="text-left min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {tenant.name}
                                            </p>
                                            <p className="text-[10px] text-gray-500 capitalize">{tenant.plan}</p>
                                        </div>
                                    </div>
                                    {currentTenant.id === tenant.id && (
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {tenants.length === 0 && (
                            <div className="px-3 py-3 text-sm text-gray-500">
                                No organizations found
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
