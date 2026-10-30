import type { LucideIcon } from 'lucide-react';
import {
  TruckIcon,
  FileWarningIcon,
  LayoutDashboardIcon,
  SirenIcon,
  WorkflowIcon,
  ListOrderedIcon,
  GitCompareIcon,
  StampIcon,
  WarehouseIcon,
  InboxIcon,
  PackageSearchIcon,
  MessageSquareIcon,
  DatabaseIcon,
  ShieldCheckIcon } from
'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navGroups: {label: string;items: NavItem[];}[] = [
{
  label: 'Operations',
  items: [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboardIcon },
  { label: 'Disruption alerts', path: '/alerts', icon: SirenIcon },
  { label: 'Impact trace', path: '/impact', icon: WorkflowIcon },
  { label: 'Order risk', path: '/orders', icon: ListOrderedIcon },
  { label: 'Recovery options', path: '/recovery', icon: GitCompareIcon },
  { label: 'Approvals', path: '/approvals', icon: StampIcon },
  { label: 'Warehouses', path: '/warehouses', icon: WarehouseIcon },
  { label: 'Driver delays & AI', path: '/admin?tab=agent-delays', icon: FileWarningIcon },
  { label: 'Customer complaints', path: '/admin?tab=complaints', icon: MessageSquareIcon }]
},
{
  label: 'Field',
  items: [
  { label: 'My deliveries', path: '/agent/deliveries', icon: TruckIcon },
  { label: 'Report delay', path: '/agent/report', icon: FileWarningIcon }]

},
{
  label: 'Parent company',
  items: [{ label: 'Requests', path: '/parent/requests', icon: InboxIcon }]
},
{
  label: 'Customer',
  items: [
  { label: 'Track order', path: '/customer/track', icon: PackageSearchIcon },
  { label: 'Care & complaints', path: '/customer/care', icon: MessageSquareIcon }]

},
{
  label: 'Platform',
  items: [
  { label: 'Data & webhooks', path: '/data', icon: DatabaseIcon },
  { label: 'Admin & audit', path: '/admin', icon: ShieldCheckIcon }]

}];