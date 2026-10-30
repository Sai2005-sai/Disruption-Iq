import { AgentTicket, DelayReason, Delivery } from '../types/domain';

export const routeHub = { lat: 13.0694, lng: 80.1948, label: 'SwiftLane Hub · Koyambedu' };

export const deliveries: Delivery[] = [
{ id: 'DLV-2201', orderId: 'ORD-10466', customer: 'Lakshmi Stores', area: 'Anna Nagar', eta: '09:20', window: '09:00–10:00', status: 'Delivered', packages: 3, lat: 13.085, lng: 80.2101 },
{ id: 'DLV-2202', orderId: 'ORD-10471', customer: 'Kiran Electricals', area: 'Kilpauk', eta: '09:55', window: '09:30–10:30', status: 'Delivered', packages: 1, lat: 13.0827, lng: 80.2407 },
{ id: 'DLV-2203', orderId: 'ORD-10474', customer: 'Arun Hardware', area: 'Egmore', eta: '10:30', window: '10:00–11:00', status: 'Delivered', packages: 2, lat: 13.0732, lng: 80.2609 },
{ id: 'DLV-2205', orderId: 'ORD-10486', customer: 'Meenakshi Textiles', area: 'T. Nagar', eta: '12:15', window: '12:00–13:00', status: 'Next stop', packages: 4, lat: 13.0418, lng: 80.2341 },
{ id: 'DLV-2206', orderId: 'ORD-10489', customer: 'Coastal Pharma Equipment', area: 'Guindy', eta: '13:10', window: '13:00–14:00', status: 'In transit', packages: 2, lat: 13.0067, lng: 80.2206 },
{ id: 'DLV-2204', orderId: 'ORD-10482', customer: 'Sundaram Motors', area: 'Ambattur Industrial Estate', eta: '13:40', window: '11:00–12:00', status: 'Delayed', packages: 6, lat: 13.0982, lng: 80.1622 },
{ id: 'DLV-2207', orderId: 'ORD-10493', customer: 'Velan Auto Parts', area: 'Velachery', eta: '14:35', window: '14:00–15:00', status: 'Pending', packages: 2, lat: 12.9815, lng: 80.2180 },
{ id: 'DLV-2208', orderId: 'ORD-10497', customer: 'Bayline Foods', area: 'Adyar', eta: '15:20', window: '15:00–16:00', status: 'Pending', packages: 5, lat: 13.0012, lng: 80.2565 }];


export const delayReasons: DelayReason[] = [
{ id: 'traffic', label: 'Traffic jam', minor: true, safety: false },
{ id: 'breakdown', label: 'Vehicle breakdown', minor: false, safety: true },
{ id: 'weather', label: 'Bad weather', minor: true, safety: false },
{ id: 'address', label: 'Address not found', minor: true, safety: false },
{ id: 'unavailable', label: 'Customer unavailable', minor: true, safety: false },
{ id: 'closure', label: 'Road closure', minor: true, safety: false },
{ id: 'pickup', label: 'Warehouse pickup delay', minor: true, safety: false },
{ id: 'damaged', label: 'Damaged package', minor: false, safety: false },
{ id: 'customs', label: 'Port / customs hold', minor: false, safety: false },
{ id: 'strike', label: 'Strike', minor: false, safety: false },
{ id: 'fuel', label: 'Fuel shortage', minor: false, safety: false },
{ id: 'security', label: 'Security checkpoint', minor: true, safety: false },
{ id: 'accident', label: 'Accident', minor: false, safety: true },
{ id: 'handover', label: 'Supplier late handover', minor: false, safety: false },
{ id: 'power', label: 'Power outage', minor: true, safety: false }];


export const recentTickets: AgentTicket[] = [
{ id: 'TKT-4469', orderId: 'ORD-10489', reason: 'Road closure', submitted: 'Today, 08:27', outcome: 'Resolved' },
{ id: 'TKT-4463', orderId: 'ORD-10458', reason: 'Customer unavailable', submitted: 'Today, 03:00', outcome: 'Resolved' },
{ id: 'TKT-4451', orderId: 'ORD-10431', reason: 'Damaged package', submitted: 'Yesterday, 16:12', outcome: 'Escalated' }];