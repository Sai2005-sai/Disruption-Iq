import { RiskLevel, Severity } from '../types/domain';

export const kpis = [
{ id: 'disruptions', label: 'Active disruptions', value: '4', delta: '+1 today', tone: 'neutral' as const, to: '/alerts' },
{ id: 'orders', label: 'Affected orders', value: '18', delta: '6 from DIS-2041', tone: 'neutral' as const, to: '/orders' },
{ id: 'critical', label: 'Critical risks', value: '2', delta: 'SLA breach < 26h', tone: 'critical' as const, to: '/orders' },
{ id: 'approvals', label: 'Pending approvals', value: '3', delta: 'Oldest 2h 10m', tone: 'neutral' as const, to: '/approvals' },
{ id: 'shortages', label: 'Inventory shortages', value: '3 SKUs', delta: '148 units total', tone: 'neutral' as const, to: '/impact' },
{ id: 'recovery', label: 'Recovery progress', value: '64%', delta: '+9 pts vs yesterday', tone: 'positive' as const, to: '/recovery' }];


export const severityChart: {name: Severity;value: number;risk: RiskLevel;}[] = [
{ name: 'Minor', value: 9, risk: 'Low' },
{ name: 'Moderate', value: 6, risk: 'Moderate' },
{ name: 'Major', value: 4, risk: 'High' },
{ name: 'Critical', value: 2, risk: 'Critical' }];


export const supplierScores = [
{ supplier: 'Vertex Electro', score: 91 },
{ supplier: 'Deccan Polymers', score: 84 },
{ supplier: 'Nova Textiles', score: 76 },
{ supplier: 'Coromandel Metals', score: 70 },
{ supplier: 'Apex Components', score: 58 }];


export const recoveryTrend = [
{ day: '23 Oct', progress: 12, target: 15 },
{ day: '24 Oct', progress: 21, target: 28 },
{ day: '25 Oct', progress: 30, target: 40 },
{ day: '26 Oct', progress: 38, target: 50 },
{ day: '27 Oct', progress: 47, target: 60 },
{ day: '28 Oct', progress: 55, target: 70 },
{ day: '29 Oct', progress: 64, target: 80 }];


export const pendingApprovals = [
{ id: 'PO-8812', title: 'Expedite fabric freight — Nova Textiles', amount: '₹48,500', approver: 'Procurement Approver', age: '2h 10m' },
{ id: 'TRF-3307', title: 'Hyderabad → Chennai transfer, 40 × PSU-48V', amount: '₹22,800', approver: 'Parent Company', age: '1h 05m' }];


export interface FeedAlert {
  id: string;
  title: string;
  source: string;
  risk: RiskLevel;
  time: string;
}

export const initialFeed: FeedAlert[] = [
{ id: 'F-1', title: 'SHP-7731 dispatch moved to 2 Nov', source: 'Apex Components Ltd', risk: 'High', time: '09:18' },
{ id: 'F-2', title: 'AWB 77812045 ETA +9h', source: 'BlueDart webhook', risk: 'Moderate', time: '08:54' },
{ id: 'F-3', title: 'Road closure, Guindy — auto-resolved', source: 'Agent ticket TKT-4469', risk: 'Low', time: '08:27' },
{ id: 'F-4', title: 'Customs hold MSKU 4471203', source: 'Maersk webhook', risk: 'Critical', time: '06:30' }];


export const feedPool: Omit<FeedAlert, 'id' | 'time'>[] = [
{ title: 'Rain alert on Chennai–Tada corridor', source: 'Weather feed', risk: 'Moderate' },
{ title: 'TKT-4472 address not found, Kolathur', source: 'Agent ticket', risk: 'Low' },
{ title: 'SHP-7740 left Tiruppur on time', source: 'Nova Textiles', risk: 'Low' },
{ title: 'Fuel shortage at Oragadam depot', source: 'Fleet telemetry', risk: 'High' },
{ title: 'AWB 77812061 out for delivery', source: 'BlueDart webhook', risk: 'Low' }];