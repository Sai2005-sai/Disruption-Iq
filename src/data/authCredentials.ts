import { Role } from '../types/domain';

export interface PortalCredential {
  portalId: 'agent' | 'admin' | 'parent' | 'customer';
  portalName: string;
  role: Role;
  email: string;
  password: string;
  userName: string;
  org: string;
  accessiblePages: { name: string; path: string }[];
  description: string;
}

export const portalCredentials: PortalCredential[] = [
  {
    portalId: 'agent',
    portalName: 'Delivery Agent Portal',
    role: 'delivery_agent',
    email: 'agent@swiftlane.in',
    password: 'agent123',
    userName: 'Ravi Kumar',
    org: 'SwiftLane Logistics',
    accessiblePages: [
      { name: 'My Deliveries', path: '/agent/deliveries' },
      { name: 'Report Delay', path: '/agent/report' }
    ],
    description: 'Driver on the road · View package drops and report field delays.'
  },
  {
    portalId: 'admin',
    portalName: 'Delivery Partner Admin Portal',
    role: 'partner_admin',
    email: 'admin@swiftlane.in',
    password: 'admin123',
    userName: 'Meera Iyer',
    org: 'SwiftLane Logistics',
    accessiblePages: [
      { name: 'Operations Dashboard', path: '/dashboard' },
      { name: 'Disruption Alerts', path: '/alerts' },
      { name: 'Impact Trace', path: '/impact' },
      { name: 'Order Risk Ranking', path: '/orders' },
      { name: 'Recovery Options', path: '/recovery' },
      { name: 'Approvals Workflow', path: '/approvals' },
      { name: 'Data & Webhooks', path: '/data' },
      { name: 'Customer Complaints & Escalations', path: '/admin?tab=complaints' },
      { name: 'Admin & Audit Trail', path: '/admin' }
    ],
    description: 'Logistics coordinator · Oversee alerts, risk scores, and recovery plans.'
  },
  {
    portalId: 'parent',
    portalName: 'Parent Company Portal',
    role: 'parent_company',
    email: 'parent@kaveri.in',
    password: 'parent123',
    userName: 'Rahul Khanna',
    org: 'Kaveri Industries',
    accessiblePages: [
      { name: 'Transfer Requests', path: '/parent/requests' },
      { name: 'Warehouse Network', path: '/warehouses' }
    ],
    description: 'Inventory owner · Authorize regional stock reallocation and view warehouses.'
  },
  {
    portalId: 'customer',
    portalName: 'Customer Portal',
    role: 'customer',
    email: 'customer@sundaram.in',
    password: 'customer123',
    userName: 'Sneha Pillai',
    org: 'Sundaram Motors',
    accessiblePages: [
      { name: 'Track My Order', path: '/customer/track' },
      { name: 'Customer Care & Complaints', path: '/customer/care' }
    ],
    description: 'B2B Client · Track live shipment ETA and receive verified delay explanations.'
  }
];

export function findCredential(email: string, password: string): PortalCredential | null {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  return (
    portalCredentials.find(
      (c) => c.email.toLowerCase() === cleanEmail && c.password === cleanPassword
    ) || null
  );
}
