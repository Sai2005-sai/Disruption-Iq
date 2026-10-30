import { PlatformUser, Role } from '../types/domain';

export const platformUsers: PlatformUser[] = [
{ id: 'U-001', name: 'Anita Desai', email: 'anita.desai@swiftlane.in', role: 'admin', scope: 'All regions', status: 'Active', lastActive: 'Now' },
{ id: 'U-002', name: 'Arjun Menon', email: 'arjun.menon@swiftlane.in', role: 'scm', scope: 'South region', status: 'Active', lastActive: '5m ago' },
{ id: 'U-003', name: 'Priya Raman', email: 'priya.raman@swiftlane.in', role: 'ops_analyst', scope: 'Chennai desk', status: 'Active', lastActive: '12m ago' },
{ id: 'U-004', name: 'Kavya Reddy', email: 'kavya.reddy@swiftlane.in', role: 'procurement', scope: 'South region', status: 'Active', lastActive: '1h ago' },
{ id: 'U-005', name: 'Suresh Babu', email: 'suresh.babu@swiftlane.in', role: 'warehouse_operator', scope: 'WH-CHN-01', status: 'Active', lastActive: '48m ago' },
{ id: 'U-006', name: 'Lokesh Naidu', email: 'lokesh.naidu@swiftlane.in', role: 'warehouse_operator', scope: 'WH-HYD-03', status: 'Active', lastActive: '3h ago' },
{ id: 'U-007', name: 'Farah Sheikh', email: 'farah.sheikh@swiftlane.in', role: 'ops_analyst', scope: 'Chennai desk', status: 'Invited', lastActive: '—' },
{ id: 'U-008', name: 'Vikram Rao', email: 'vikram.rao@swiftlane.in', role: 'scm', scope: 'West region', status: 'Suspended', lastActive: '14 Oct' }];


export const permissions = [
'View disruptions & alerts',
'Classify severity',
'Create recovery plans',
'Approve recovery plans',
'Execute simulation',
'Confirm warehouse stock',
'Import data & webhooks',
'Manage users & roles',
'View audit trail'];


export const matrixRoles: Role[] = ['ops_analyst', 'scm', 'warehouse_operator', 'procurement', 'admin'];

export const defaultMatrix: Record<string, Role[]> = {
  'View disruptions & alerts': ['ops_analyst', 'scm', 'warehouse_operator', 'procurement', 'admin'],
  'Classify severity': ['ops_analyst', 'scm', 'admin'],
  'Create recovery plans': ['ops_analyst', 'scm'],
  'Approve recovery plans': ['scm', 'procurement'],
  'Execute simulation': ['scm', 'admin'],
  'Confirm warehouse stock': ['warehouse_operator'],
  'Import data & webhooks': ['ops_analyst', 'admin'],
  'Manage users & roles': ['admin'],
  'View audit trail': ['ops_analyst', 'scm', 'procurement', 'admin']
};

export const dataQuality = {
  totals: [
  { label: 'Duplicate records', value: 14, note: '9 auto-merged · 5 need review' },
  { label: 'Invalid records', value: 23, note: 'Schema or format errors' },
  { label: 'Conflicting records', value: 5, note: 'Differs from live source' },
  { label: 'Duplicate webhooks blocked', value: 31, note: 'Idempotency keys reused' }],

  bySource: [
  { source: 'OMS order import (CSV)', records: 4820, duplicates: 6, invalid: 11, conflicts: 1 },
  { source: 'Supplier ASN feed (JSON)', records: 1210, duplicates: 3, invalid: 7, conflicts: 2 },
  { source: 'Carrier webhooks', records: 9634, duplicates: 31, invalid: 2, conflicts: 0 },
  { source: 'WMS stock sync', records: 2288, duplicates: 5, invalid: 3, conflicts: 2 }]

};