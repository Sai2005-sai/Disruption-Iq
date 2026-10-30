import type { LucideIcon } from 'lucide-react';
import { TruckIcon, BuildingIcon, Building2Icon, UserIcon } from 'lucide-react';
import { Role } from '../types/domain';

export const portals: {role: Role;title: string;description: string;icon: LucideIcon;}[] = [
{ role: 'delivery_agent', title: 'Delivery Agent', description: 'Your route, deliveries and delay tickets', icon: TruckIcon },
{ role: 'partner_admin', title: 'Delivery Partner Admin', description: 'Disruptions, risk and recovery plans', icon: BuildingIcon },
{ role: 'parent_company', title: 'Parent Company', description: 'Stock confirmations and transfer approvals', icon: Building2Icon },
{ role: 'customer', title: 'Customer', description: 'Track orders and contact care', icon: UserIcon }];