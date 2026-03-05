export type UserRole = 'admin' | 'manager';

export const ROLE_PERMISSIONS = {
  admin: [
    '/analytics',
    '/appointments',
    '/invoices',
    '/staff',
    '/staff/attendance',
    '/staff/payroll',
    '/payroll',
    '/services',
    '/settings',
    '/clients',
    '/booking',
    '/history',
  ],
  manager: [
    '/appointments',
    '/invoices',
    '/staff/attendance',
    '/clients',
    '/booking',
    '/history',
  ],
} as const;

export function canAccessRoute(role: UserRole, path: string): boolean {
  const allowed = ROLE_PERMISSIONS[role];

  return allowed.some((allowedPath) => {
    if (path === allowedPath) return true;
    return path.startsWith(`${allowedPath}/`);
  });
}
