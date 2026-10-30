import { AuditEntry } from '../types/domain';

export const seedAudit: AuditEntry[] = [
{
  id: 'AUD-9008',
  timestamp: '29 Oct, 10:12',
  user: 'Suresh Babu',
  role: 'Warehouse Operator',
  action: 'Data update',
  target: 'WH-CHN-01 · ICM-220',
  reason: 'Cycle count reconciled with scanner sync',
  before: 'On hand: 38',
  after: 'On hand: 35'
},
{
  id: 'AUD-9007',
  timestamp: '29 Oct, 09:41',
  user: 'Priya Raman',
  role: 'Operations Analyst',
  action: 'Modification',
  target: 'ALT-3105',
  reason: 'QC hold blocks 3 inbound lots for Bengaluru',
  before: 'Severity: Unclassified',
  after: 'Severity: Major'
},
{
  id: 'AUD-9006',
  timestamp: '29 Oct, 09:22',
  user: 'Ravi Kumar',
  role: 'Delivery Agent',
  action: 'Report',
  target: 'TKT-4469',
  reason: 'Road closure at Guindy flyover',
  after: 'Auto-resolved under MIP-04'
},
{
  id: 'AUD-9005',
  timestamp: '28 Oct, 18:30',
  user: 'Arjun Menon',
  role: 'Supply Chain Manager',
  action: 'Execution',
  target: 'RC-2038',
  reason: 'Simulated execution passed revalidation',
  before: 'Approved',
  after: 'Executed (simulation)'
},
{
  id: 'AUD-9004',
  timestamp: '28 Oct, 17:55',
  user: 'Kavya Reddy',
  role: 'Procurement Approver',
  action: 'Approval',
  target: 'RC-2038',
  reason: 'Within quarterly expedited freight budget'
},
{
  id: 'AUD-9003',
  timestamp: '28 Oct, 16:40',
  user: 'Arjun Menon',
  role: 'Supply Chain Manager',
  action: 'Rejection',
  target: 'RC-2036',
  reason: 'Alternative supplier not qualified for ICM product line',
  before: 'In review',
  after: 'Rejected'
},
{
  id: 'AUD-9002',
  timestamp: '28 Oct, 15:02',
  user: 'Priya Raman',
  role: 'Operations Analyst',
  action: 'Plan created',
  target: 'RC-2038',
  reason: 'Expedite carrier shipment AWB 77812045',
  after: 'Expedite shipment · ₹48,500'
},
{
  id: 'AUD-9001',
  timestamp: '28 Oct, 11:20',
  user: 'Anita Desai',
  role: 'Administrator',
  action: 'Data update',
  target: 'User · Farah Sheikh',
  reason: 'Onboarding to Chennai operations desk',
  before: 'Role: Viewer',
  after: 'Role: Operations Analyst'
}];