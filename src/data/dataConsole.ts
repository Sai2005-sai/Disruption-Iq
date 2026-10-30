export type IssueType = 'invalid' | 'duplicate' | 'conflicting';

export const validationSummary = { valid: 1184, invalid: 7, duplicate: 4, conflicting: 2 };

export const validationIssues: {row: number;record: string;type: IssueType;reason: string;}[] = [
{ row: 14, record: 'ORD-10533', type: 'invalid', reason: 'Missing required field: delivery_pincode' },
{ row: 27, record: 'SHP-7735', type: 'invalid', reason: 'eta "2026-13-02" is not a valid ISO date' },
{ row: 33, record: 'ORD-10541', type: 'invalid', reason: 'quantity must be a positive integer (got -4)' },
{ row: 41, record: 'ORD-10482', type: 'duplicate', reason: 'Duplicate of row 9 (same order_id + line_no)' },
{ row: 58, record: 'WH-CHN-01 / ICM-220', type: 'conflicting', reason: 'stock 38 conflicts with live count 35 (Warehouse Operator, 10:12)' },
{ row: 66, record: 'SHP-7731', type: 'conflicting', reason: 'eta 29 Oct conflicts with supplier notice AP-2210 (2 Nov)' },
{ row: 72, record: 'ORD-10477', type: 'duplicate', reason: 'Duplicate of row 12 (same order_id + line_no)' },
{ row: 90, record: 'SUP-APEX', type: 'invalid', reason: 'Unknown supplier_code "APX-01"' }];


export const webhookCarriers = ['TVS Freight', 'BlueDart', 'Delhivery', 'Maersk'];

export const scenarios = [
  {
    id: 'scn-1',
    name: 'Scenario 1: Supplier delay (5 days · 12 orders at risk · 3 P1 high-priority)',
    description:
      'Supplier X (Apex Components Ltd) is delayed 5 days on SHP-7731, placing 12 dependent orders at risk, including 3 high-priority (P1) customers.',
    steps: [
      'Supplier notice AP-2210 ingested (5-day delay on SHP-7731)',
      'SHP-7731 ETA revised 29 Oct → 3 Nov',
      'Warehouse B (WH-CHN-01 Chennai) projected stock shortage calculated',
      '12 dependent orders traced & risk-scored · 3 High-Priority (P1) Critical',
      'Alert ALT-3108 raised for impact trace & recovery planning'
    ],
    to: '/impact'
  },
  {
    id: 'scn-2',
    name: 'Scenario 2: Carrier webhook delay + stock shortage → reallocate or expedite',
    description:
      'Carrier webhook (Delhivery DL123456) reports shipment DELAYED due to weather, and Warehouse B (Chennai) lacks stock to cover affected orders — system recommends reallocating from Warehouse A (Bengaluru) or expediting.',
    steps: [
      'POST /webhooks/carrier event_id evt_1001 received (Delhivery DL123456 DELAYED)',
      'Idempotency key & timestamp ordering verified — first delivery accepted',
      'Warehouse B (WH-CHN-01) stock checked: insufficient on-hand inventory',
      'Warehouse A (WH-BLR-02 Bengaluru) verified with 120 uncommitted surplus units',
      'Recovery options ranked: Reallocate from Warehouse A (Recommended) or Expedite shipment'
    ],
    to: '/recovery'
  }
];