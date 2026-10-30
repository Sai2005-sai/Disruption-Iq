import { RecoveryOption } from '../types/domain';

export const recoveryOptions: RecoveryOption[] = [
  {
    id: 'opt-reallocate',
    title: 'Reallocate stock from Bengaluru',
    summary: 'Move 120 uncommitted ICM-220 units from WH-BLR-02 to Chennai by road freight.',
    cost: 184000,
    timeSavedDays: 4.5,
    ordersCovered: 12,
    feasibility: { inventory: true, deadline: true, constraints: true },
    feasibilityNote: '120 free surplus units verified · arrives 30 Oct 01:40 (4h 20m before earliest P1 deadline)',
    approvers: ['scm', 'procurement', 'parent_company'],
    remainingRisk: 'Low',
    recommended: true,
    pros: [
      'Covers all 12 customer orders including all 3 P1 Critical line-stoppages',
      'Arrives 4h 20m before Sundaram Motors deadline',
      'Uses existing parent-owned surplus inventory — no spot procurement markup'
    ],
    cons: [
      'Requires three approvals including Parent Company authorization',
      'Leaves Bengaluru warehouse with 60 units (matching its planned demand)'
    ]
  },
  {
    id: 'opt-expedite',
    title: 'Expedite shipment SHP-7731',
    summary: 'Pay Apex for emergency overtime and charter priority air-freight on 31 Oct.',
    cost: 320000,
    timeSavedDays: 2.5,
    ordersCovered: 7,
    feasibility: { inventory: true, deadline: false, constraints: true },
    feasibilityNote: 'Lands 31 Oct 11:00 — misses all 3 P1 deadlines (ORD-10482, ORD-10477, ORD-10485)',
    approvers: ['scm', 'procurement'],
    remainingRisk: 'High',
    pros: [
      'No dependency on other regional warehouses',
      'Restores the original inbound supply pipeline'
    ],
    cons: [
      'Expensive priority air charter surcharge (₹3,20,000)',
      'All 3 Critical P1 orders will still breach contractual SLAs',
      'Contingent on supplier completing repairs on time'
    ]
  },
  {
    id: 'opt-alt-supplier',
    title: 'Alternative supplier (Vertex Electro Parts)',
    summary: 'Source 120 units from Vertex Electro Parts, Pune, on an emergency spot PO.',
    cost: 410000,
    timeSavedDays: 2,
    ordersCovered: 9,
    feasibility: { inventory: true, deadline: true, constraints: false },
    feasibilityNote: 'Vertex is not yet quality-certified for the ICM-220 product line (QA audit due 12 Nov)',
    approvers: ['scm', 'procurement'],
    remainingRisk: 'Moderate',
    pros: [
      'Completely bypasses Apex factory breakdown',
      'Vertex maintains an outstanding 91 reliability score'
    ],
    cons: [
      'Fails supplier qualification constraint (unapproved for ICM-220)',
      'Highest spot purchase cost (+38% spot premium)',
      'ORD-10482 remains at risk if Pune-Chennai road transit slips'
    ]
  },
  {
    id: 'opt-split',
    title: 'Split orders into multiple deliveries',
    summary: 'Immediately deliver the 35 units on hand to P1 orders; balance follows SHP-7731.',
    cost: 62000,
    timeSavedDays: 1,
    ordersCovered: 5,
    feasibility: { inventory: true, deadline: true, constraints: true },
    feasibilityNote: 'Partial deliveries accepted by only 5 of 12 customer contracts',
    approvers: ['scm'],
    remainingRisk: 'Moderate',
    pros: [
      'Lowest cost and can dispatch within the hour',
      'Requires only a single internal approval (Supply Chain Manager)'
    ],
    cons: [
      'Only provides partial quantities (40% of P1 demand)',
      'Requires double handling and multiple delivery runs',
      '7 non-P1 orders remain completely unfulfilled until 3 Nov'
    ]
  },
  {
    id: 'opt-transfer',
    title: 'Inter-warehouse transfer (Coimbatore + Puducherry)',
    summary: 'Consolidate 62 units from WH-CBE-04 and WH-PDY-05 into Chennai.',
    cost: 126000,
    timeSavedDays: 2.5,
    ordersCovered: 6,
    feasibility: { inventory: false, deadline: true, constraints: true },
    feasibilityNote: 'Only 62 of 120 required units available across both regional warehouses',
    approvers: ['scm', 'parent_company'],
    remainingRisk: 'Moderate',
    pros: [
      'Both warehouses are within 3 to 9 hours of Chennai',
      'Moderate freight expenditure'
    ],
    cons: [
      'Fails inventory feasibility (provides only 51% of required deficit)',
      'Requires coordinating two distinct trucks and dispatch windows'
    ]
  }
];