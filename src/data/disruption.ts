import { Severity } from '../types/domain';

export const activeDisruption = {
  id: 'DIS-2041',
  caseId: 'RC-2041',
  alertId: 'ALT-3108',
  title: 'Supplier delay on SHP-7731 (Apex Components)',
  summary:
    'Apex Components 5-day factory delay on SHP-7731 causes a 120-unit stock shortage at Chennai warehouse, putting 12 customer orders at risk (3 Critical P1 line-stoppages).',
  supplier: 'Apex Components Ltd',
  shipment: 'SHP-7731',
  warehouse: 'Chennai · WH-CHN-01',
  product: 'ICM-220 Industrial Control Module',
  shortage: 120,
  ordersAtRisk: 12,
  critical: 3,
  severity: 'Major' as Severity,
  detected: '29 Oct 2026, 09:18',
  delayDays: 5
};

export type TraceStatus = 'delayed' | 'at-risk' | 'ok';

export interface TraceNode {
  id: string;
  stage: string;
  title: string;
  subtitle: string;
  status: TraceStatus;
  metric: string;
  detail: string;
}

export const traceNodes: TraceNode[] = [
  {
    id: 'supplier',
    stage: 'Supplier',
    title: 'Apex Components Ltd',
    subtitle: 'Hosur plant · PO-8806',
    status: 'delayed',
    metric: 'Production delayed 5 days',
    detail: 'Reflow oven breakdown on SMT line 3. Supplier-confirmed revised dispatch: 3 Nov, 08:00.'
  },
  {
    id: 'shipment',
    stage: 'Shipment',
    title: 'SHP-7731',
    subtitle: '200 × ICM-220 · Road freight',
    status: 'delayed',
    metric: 'ETA 29 Oct → 3 Nov',
    detail: 'Not dispatched. TVS Freight carrier slot released; 120 units required immediately to prevent assembly halts.'
  },
  {
    id: 'warehouse',
    stage: 'Warehouse',
    title: 'Chennai WH-CHN-01',
    subtitle: 'Ambattur Industrial Estate',
    status: 'at-risk',
    metric: '35 on hand · 155 needed',
    detail: 'Weekly replenishment relied on SHP-7731. Safety stock was consumed on 27 Oct.'
  },
  {
    id: 'stock',
    stage: 'Product stock',
    title: 'ICM-220',
    subtitle: 'Industrial Control Module',
    status: 'delayed',
    metric: '120 units short',
    detail: 'Severe shortage persists until inter-warehouse transfer from Bengaluru WH-BLR-02 is executed.'
  },
  {
    id: 'orders',
    stage: 'Customer orders',
    title: '12 orders at risk',
    subtitle: '3 Critical (P1) · 4 High (P2) · 3 Moderate (P3) · 2 Low (P4)',
    status: 'delayed',
    metric: 'Earliest deadline in 18h',
    detail: 'Sundaram Motors (Ambattur), Coastal Pharma (Guindy), and Bharat Heavy Electricals (Ennore) face imminent line stoppages.'
  }
];

export const parallelChain = ['Nova Textiles', 'SHP-7745', 'Bengaluru WH-BLR-02', 'FAB-112 stock', '14 orders'];

export const affectedWarehouses = [
  { id: 'WH-CHN-01', name: 'Chennai · Ambattur', product: 'ICM-220', current: 35, required: 155, note: 'Primary impact · 120 unit deficit' },
  { id: 'WH-HYD-03', name: 'Hyderabad · Shamshabad', product: 'ICM-220', current: 62, required: 90, note: 'Secondary · 5+ days buffer available' },
  { id: 'WH-BLR-02', name: 'Bengaluru · Hoskote', product: 'ICM-220', current: 180, required: 60, note: 'Surplus · 120 free units available for transfer' }
];

export const aiSummary = {
  headline: 'A 5-day supplier delay leaves Chennai 120 units short of ICM-220 — 3 P1 orders breach SLA within 32 hours.',
  body: 'Apex Components Ltd confirmed a production stoppage on SMT line 3, so SHP-7731 (200 units) will not dispatch until 3 Nov. Chennai WH-CHN-01 holds only 35 units against 155 committed, leaving 12 customer orders exposed. Bengaluru WH-BLR-02 has 120 uncommitted units within a 6h 40m road transfer, which is the only option providing full coverage before the first customer deadline.',
  bullets: [
    'Root cause verified against supplier notice AP-2210 and carrier slot release',
    '3 P1 orders at risk: Sundaram Motors (due in 18h), Coastal Pharma (26h), Bharat Heavy Electricals (32h)',
    'Bengaluru warehouse has 120 surplus units ready to dispatch'
  ],
  confidence: 0.94,
  sources: ['Supplier notice #AP-2210', 'TVS Freight webhook', 'WMS cycle count 10:12', 'OMS order book']
};