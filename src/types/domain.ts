export type Role =
'delivery_agent' |
'partner_admin' |
'parent_company' |
'customer' |
'ops_analyst' |
'scm' |
'warehouse_operator' |
'procurement' |
'admin';

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical';
export type Severity = 'Minor' | 'Moderate' | 'Major' | 'Critical';

export type DeliveryStatus = 'Delivered' | 'In transit' | 'Next stop' | 'Delayed' | 'Pending';

export interface Delivery {
  id: string;
  orderId: string;
  customer: string;
  area: string;
  eta: string;
  window: string;
  status: DeliveryStatus;
  packages: number;
  lat: number;
  lng: number;
}

export interface DelayReason {
  id: string;
  label: string;
  minor: boolean;
  safety: boolean;
}

export interface AgentTicket {
  id: string;
  orderId: string;
  reason: string;
  submitted: string;
  time?: string;
  status?: string;
  outcome: 'Resolved' | 'Escalated' | 'In review';
  delayMinutes?: number;
  notes?: string;
  photoCount?: number;
  agentName?: string;
  customerName?: string;
  area?: string;
  adminSolution?: string;
  solutionStatus?: 'Pending Review' | 'AI Solved' | 'Forwarded to Agent';
  forwardedAt?: string;
  forwardedBy?: string;
  revisedEta?: string;
}

export interface AiTicketSolution {
  ticketId: string;
  orderId: string;
  driverDirective: string;
  revisedEta: string;
  customerExplanation: string;
  actionPlan: string[];
  riskMitigation: string;
  source: string;
}

export type AlertSource = 'Supplier' | 'Carrier Webhook' | 'Agent Ticket';
export type AlertStatus = 'New' | 'Classified' | 'Case created' | 'Resolved';

export interface DisruptionAlert {
  id: string;
  title: string;
  source: AlertSource;
  reference: string;
  severity: Severity | 'Unclassified';
  status: AlertStatus;
  detected: string;
  minutesAgo: number;
  location: string;
  description: string;
  suggested: Severity;
  suggestionReason: string;
}

export interface RiskFactor {
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface RiskOrder {
  id: string;
  customer: string;
  area: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  deadlineHours: number;
  deadlineLabel: string;
  quantity: number;
  shortage: number;
  factors: RiskFactor[];
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  distanceKm: number;
  eta: string;
  stock: number;
  capacity: number;
  operator: string;
  lastCount: string;
  role: 'Affected' | 'Transfer source' | 'Nearby';
}

export interface RecoveryOption {
  id: string;
  title: string;
  summary: string;
  cost: number;
  timeSavedDays: number;
  ordersCovered: number;
  feasibility: {inventory: boolean;deadline: boolean;constraints: boolean;};
  feasibilityNote: string;
  approvers: Role[];
  remainingRisk: RiskLevel;
  recommended?: boolean;
  pros: string[];
  cons: string[];
}

export type StepStatus = 'waiting' | 'current' | 'approved' | 'modified' | 'rejected';

export interface WorkflowStep {
  role: Role;
  status: StepStatus;
  by?: string;
  at?: string;
  comment?: string;
}

export interface Workflow {
  planId: string;
  optionId: string | null;
  optionTitle: string | null;
  cost: number;
  quantity: number;
  dispatchMode: string;
  createdBy: string | null;
  createdByRole: Role | null;
  createdAt: string | null;
  steps: WorkflowStep[];
  state: 'none' | 'in_review' | 'approved' | 'rejected' | 'executed';
  stale: boolean;
  executedAt: string | null;
}

export type WorkflowDecision = 'approve' | 'reject' | 'modify';

export type AuditAction =
'Report' |
'Plan created' |
'Approval' |
'Rejection' |
'Modification' |
'Execution' |
'Data update';

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  target: string;
  reason: string;
  before?: string;
  after?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'alert' | 'approval' | 'system';
  to?: string;
}

export type StockAvailability = 'Available' | 'Partially Available' | 'Unavailable';

export interface ParentRequest {
  id: string;
  type: 'Transfer approval' | 'Stock confirmation';
  title: string;
  from: string;
  received: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  priority: RiskLevel;
  linkedCase: string;
  order: {id: string;customer: string;deadline: string;value: string;};
  shipment: {id: string;origin: string;destination: string;status: string;mode: string;};
  products: {sku: string;name: string;requested: number;onHand: number;location: string;availability: StockAvailability;}[];
  note: string;
}

export interface CustomerTimelineStep {
  label: string;
  time: string;
  state: 'done' | 'current' | 'upcoming' | 'issue';
  note?: string;
}

export interface CustomerOrder {
  id: string;
  items: string;
  placed: string;
  status: 'Delayed' | 'On track' | 'Delivered';
  originalEta: string;
  revisedEta: string | null;
  explanation: string | null;
  verifiedAt: string | null;
  destination: {lat: number;lng: number;label: string;};
  current: {lat: number;lng: number;label: string;};
  timeline: CustomerTimelineStep[];
}

export interface Complaint {
  id: string;
  orderId: string;
  category: string;
  description: string;
  submitted: string;
  status: 'Submitted' | 'In review' | 'Resolved';
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
}

export interface CustomerNotice {
  id: string;
  kind: 'Delay notice' | 'ETA change' | 'Resolution' | 'Update';
  title: string;
  body: string;
  time: string;
  unread: boolean;
  complaintId?: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  scope: string;
  status: 'Active' | 'Invited' | 'Suspended';
  lastActive: string;
}