import { Role } from '../types/domain';

export interface RoleUser {
  name: string;
  email: string;
  initials: string;
}

export interface RoleMeta {
  label: string;
  short: string;
  kind: 'portal' | 'internal';
  home: string;
  org: string;
  user: RoleUser;
}

export const roleMeta: Record<Role, RoleMeta> = {
  delivery_agent: {
    label: 'Delivery Agent',
    short: 'Agent',
    kind: 'portal',
    home: '/agent/deliveries',
    org: 'SwiftLane Logistics',
    user: { name: 'Ravi Kumar', email: 'ravi.kumar@swiftlane.in', initials: 'RK' }
  },
  partner_admin: {
    label: 'Delivery Partner Admin',
    short: 'Partner Admin',
    kind: 'portal',
    home: '/dashboard',
    org: 'SwiftLane Logistics',
    user: { name: 'Meera Iyer', email: 'meera.iyer@swiftlane.in', initials: 'MI' }
  },
  parent_company: {
    label: 'Parent Company',
    short: 'Parent Co.',
    kind: 'portal',
    home: '/parent/requests',
    org: 'Kaveri Industries',
    user: { name: 'Rahul Khanna', email: 'rahul.khanna@kaveri.co.in', initials: 'RK' }
  },
  customer: {
    label: 'Customer',
    short: 'Customer',
    kind: 'portal',
    home: '/customer/track',
    org: 'Sundaram Motors',
    user: { name: 'Sneha Pillai', email: 'sneha.pillai@sundarammotors.in', initials: 'SP' }
  },
  ops_analyst: {
    label: 'Operations Analyst',
    short: 'Ops Analyst',
    kind: 'internal',
    home: '/dashboard',
    org: 'SwiftLane Logistics',
    user: { name: 'Priya Raman', email: 'priya.raman@swiftlane.in', initials: 'PR' }
  },
  scm: {
    label: 'Supply Chain Manager',
    short: 'SCM',
    kind: 'internal',
    home: '/dashboard',
    org: 'SwiftLane Logistics',
    user: { name: 'Arjun Menon', email: 'arjun.menon@swiftlane.in', initials: 'AM' }
  },
  warehouse_operator: {
    label: 'Warehouse Operator',
    short: 'WH Operator',
    kind: 'internal',
    home: '/warehouses',
    org: 'SwiftLane Logistics',
    user: { name: 'Suresh Babu', email: 'suresh.babu@swiftlane.in', initials: 'SB' }
  },
  procurement: {
    label: 'Procurement Approver',
    short: 'Procurement',
    kind: 'internal',
    home: '/approvals',
    org: 'SwiftLane Logistics',
    user: { name: 'Kavya Reddy', email: 'kavya.reddy@swiftlane.in', initials: 'KR' }
  },
  admin: {
    label: 'Administrator',
    short: 'Admin',
    kind: 'internal',
    home: '/admin',
    org: 'SwiftLane Logistics',
    user: { name: 'Anita Desai', email: 'anita.desai@swiftlane.in', initials: 'AD' }
  }
};

export const portalRoles: Role[] = ['delivery_agent', 'partner_admin', 'parent_company', 'customer'];
export const internalRoles: Role[] = ['ops_analyst', 'scm', 'warehouse_operator', 'procurement', 'admin'];

const ops: Role[] = ['partner_admin', 'ops_analyst', 'scm', 'procurement', 'admin'];

export const routeAccess: Record<string, Role[]> = {
  '/agent': ['delivery_agent', 'admin'],
  '/dashboard': [...ops, 'warehouse_operator'],
  '/alerts': ['partner_admin', 'ops_analyst', 'scm', 'admin'],
  '/impact': ops,
  '/orders': ops,
  '/recovery': ['partner_admin', 'ops_analyst', 'scm', 'admin'],
  '/approvals': [...ops, 'parent_company'],
  '/warehouses': ['partner_admin', 'ops_analyst', 'scm', 'warehouse_operator', 'parent_company', 'admin'],
  '/parent': ['parent_company', 'admin'],
  '/customer': ['customer', 'admin'],
  '/data': ['ops_analyst', 'partner_admin', 'admin'],
  '/admin': ['partner_admin', 'admin']
};

export function allowedRolesFor(path: string): Role[] | null {
  const cleanPath = path.split('?')[0];
  const key = Object.keys(routeAccess).find((k) => cleanPath === k || cleanPath.startsWith(`${k}/`));
  return key ? routeAccess[key] : null;
}

export function canAccess(role: Role, path: string): boolean {
  const roles = allowedRolesFor(path);
  return !roles || roles.includes(role);
}