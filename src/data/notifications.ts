import { AppNotification } from '../types/domain';

export const seedNotifications: AppNotification[] = [
{
  id: 'N-1',
  title: '2 orders breach SLA within 26h',
  body: 'DIS-2041 · ORD-10482, ORD-10477 are Critical',
  time: '12m ago',
  read: false,
  type: 'alert',
  to: '/orders'
},
{
  id: 'N-2',
  title: 'New supplier disruption detected',
  body: 'ALT-3108 · Apex Components Ltd · SHP-7731',
  time: '42m ago',
  read: false,
  type: 'alert',
  to: '/alerts'
},
{
  id: 'N-3',
  title: 'Stock count confirmed',
  body: 'WH-CHN-01 · ICM-220 now 35 units',
  time: '1h ago',
  read: false,
  type: 'system',
  to: '/warehouses'
},
{
  id: 'N-4',
  title: 'RC-2038 executed (simulation)',
  body: 'Expedite AWB 77812045 · passed revalidation',
  time: 'Yesterday',
  read: true,
  type: 'approval',
  to: '/admin'
},
{
  id: 'N-5',
  title: 'Import completed with warnings',
  body: '1,184 valid · 13 records need review',
  time: 'Yesterday',
  read: true,
  type: 'system',
  to: '/data'
}];