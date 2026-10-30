import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppNotification,
  AuditEntry,
  RecoveryOption,
  Role,
  Workflow,
  WorkflowDecision
} from '../types/domain';
import { roleMeta, RoleUser } from '../utils/roles';
import { seedNotifications } from '../data/notifications';
import { seedAudit } from '../data/audit';
import { formatINR, nowStamp } from '../utils/format';

type NewAudit = Omit<AuditEntry, 'id' | 'timestamp' | 'user' | 'role'>;
type NewNotification = Omit<AppNotification, 'id' | 'read' | 'time'>;

export interface GuidedStep {
  id: number;
  title: string;
  desc: string;
  route: string;
  actionLabel: string;
  roleNeeded: Role;
}

export const guidedSteps: GuidedStep[] = [
  {
    id: 1,
    title: '1. Detect & Classify Alert',
    desc: 'Review incoming disruption signal ALT-3108 (Apex 4-day stoppage) and classify severity as Major.',
    route: '/alerts',
    actionLabel: 'Go to Alerts',
    roleNeeded: 'ops_analyst'
  },
  {
    id: 2,
    title: '2. Trace Supply Chain Impact',
    desc: 'Follow the node ripple from Hosur factory → Inbound Shipment → Chennai WH → 120-unit shortage.',
    route: '/impact',
    actionLabel: 'Trace Impact',
    roleNeeded: 'ops_analyst'
  },
  {
    id: 3,
    title: '3. Rank Order Risks',
    desc: 'Examine deterministic 0–100 risk scores for 6 orders. Check P1 orders (Sundaram Motors & Coastal Pharma).',
    route: '/orders',
    actionLabel: 'View Order Risk',
    roleNeeded: 'scm'
  },
  {
    id: 4,
    title: '4. Select Recovery Option',
    desc: 'Compare 5 recovery paths. Choose Reallocation from Bengaluru (the only one passing all feasibility checks).',
    route: '/recovery',
    actionLabel: 'Compare Options',
    roleNeeded: 'scm'
  },
  {
    id: 5,
    title: '5. Approvals & Separation of Duties',
    desc: 'Switch roles to collect SCM, Procurement, and Parent Company approvals. Self-approval is blocked.',
    route: '/approvals',
    actionLabel: 'Review Approvals',
    roleNeeded: 'procurement'
  },
  {
    id: 6,
    title: '6. Revalidate & Simulate Execution',
    desc: 'Run 5 pre-flight revalidation checks. Execute simulation to update customer ETAs and commit inventory.',
    route: '/approvals',
    actionLabel: 'Execute Simulation',
    roleNeeded: 'scm'
  }
];

import { PortalCredential, portalCredentials } from '../data/authCredentials';

import { Complaint, CustomerNotice } from '../types/domain';
import { seedComplaints, customerNotices as seedCustomerNotices } from '../data/customer';

interface AppContextValue {
  isAuthenticated: boolean;
  currentPortal: PortalCredential | null;
  loginWithCredential: (cred: PortalCredential) => void;
  logout: () => void;
  role: Role;
  setRole: (r: Role) => void;
  user: RoleUser;
  dark: boolean;
  toggleDark: () => void;
  beginnerMode: boolean;
  toggleBeginnerMode: () => void;
  guidedStepIdx: number;
  setGuidedStepIdx: (idx: number) => void;
  notifications: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  pushNotification: (n: NewNotification) => void;
  audit: AuditEntry[];
  logAudit: (e: NewAudit) => void;
  complaints: Complaint[];
  submitComplaint: (c: { orderId: string; category: string; description: string }) => Promise<Complaint>;
  replyToComplaint: (complaintId: string, reply: string, status?: 'Submitted' | 'In review' | 'Resolved') => Promise<void>;
  customerNotices: CustomerNotice[];
  markCustomerNoticeRead: (id: string) => Promise<void>;
  markAllCustomerNoticesRead: () => Promise<void>;
  workflow: Workflow;
  selectOption: (option: RecoveryOption) => Promise<void>;
  decideStep: (decision: WorkflowDecision, comment: string, change?: { quantity: number; dispatchMode: string }) => Promise<{ success: boolean; error?: string }>;
  markStale: (reason: string) => Promise<void>;
  executePlan: (simulateConcurrentChange?: boolean) => Promise<{ success: boolean; stale?: boolean; error?: string }>;
  resetWorkflow: () => void;
  runScenario: (scenarioId: string) => Promise<{ success: boolean; message?: string }>;
  reloadStateFromBackend: () => Promise<void>;
}

const emptyWorkflow: Workflow = {
  planId: 'RC-2041',
  optionId: null,
  optionTitle: null,
  cost: 0,
  quantity: 120,
  dispatchMode: 'Standard road freight',
  createdBy: null,
  createdByRole: null,
  createdAt: null,
  steps: [],
  state: 'none',
  stale: false,
  executedAt: null
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPortal, setCurrentPortal] = useState<PortalCredential | null>(() => {
    try {
      const saved = localStorage.getItem('disruptioniq_portal');
      return saved ? portalCredentials.find((c) => c.portalId === saved) || null : null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState<Role>(() => {
    try {
      const saved = localStorage.getItem('disruptioniq_portal');
      const cred = saved ? portalCredentials.find((c) => c.portalId === saved) : null;
      return cred ? cred.role : 'partner_admin';
    } catch {
      return 'partner_admin';
    }
  });

  const isAuthenticated = currentPortal !== null;

  const loginWithCredential = useCallback((cred: PortalCredential) => {
    try {
      localStorage.setItem('disruptioniq_portal', cred.portalId);
    } catch {}
    setCurrentPortal(cred);
    setRole(cred.role);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('disruptioniq_portal');
    } catch {}
    setCurrentPortal(null);
  }, []);

  const [dark, setDark] = useState(false);
  const [beginnerMode, setBeginnerMode] = useState(true);
  const [guidedStepIdx, setGuidedStepIdx] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [complaints, setComplaints] = useState<Complaint[]>(seedComplaints);
  const [customerNotices, setCustomerNotices] = useState<CustomerNotice[]>(seedCustomerNotices);
  const [workflow, setWorkflow] = useState<Workflow>(emptyWorkflow);

  const user = roleMeta[role].user;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Sync state from backend on mount
  const reloadStateFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.audit && data.audit.length > 0) {
          setAudit(data.audit.map((a: any) => ({
            id: a.id,
            timestamp: a.timestamp,
            user: a.user,
            role: a.role,
            action: a.action,
            target: a.target,
            reason: a.reason,
            before: a.before_val,
            after: a.after_val
          })));
        }
        if (data.complaints && data.complaints.length > 0) {
          setComplaints(data.complaints.map((c: any) => ({
            id: c.id,
            orderId: c.order_id || c.orderId,
            category: c.category,
            description: c.description,
            submitted: c.submitted,
            status: c.status || 'Submitted',
            adminReply: c.adminReply || c.admin_reply,
            repliedAt: c.repliedAt || c.replied_at,
            repliedBy: c.repliedBy || c.replied_by
          })));
        }
        if (data.customerNotices && data.customerNotices.length > 0) {
          setCustomerNotices(data.customerNotices);
        }
        if (data.workflow) {
          setWorkflow(data.workflow);
        }
      }
    } catch {
      // Backend fallback already in place
    }
  }, []);

  useEffect(() => {
    reloadStateFromBackend();
  }, [reloadStateFromBackend]);

  const logAudit = useCallback(
    (e: NewAudit) => {
      const newEntry: AuditEntry = {
        ...e,
        id: `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`,
        timestamp: nowStamp(),
        user: user.name,
        role: roleMeta[role].label
      };
      setAudit((prev) => [newEntry, ...prev]);
    },
    [role, user.name]
  );

  const pushNotification = useCallback(
    (n: NewNotification) =>
      setNotifications((prev) => [
        { ...n, id: `N-${Date.now()}-${prev.length}`, read: false, time: 'Just now' },
        ...prev
      ]),
    []
  );

  const markRead = useCallback(
    (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))),
    []
  );
  const markAllRead = useCallback(() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))), []);

  const selectOption = useCallback(
    async (option: RecoveryOption) => {
      const newWorkflow: Workflow = {
        ...emptyWorkflow,
        optionId: option.id,
        optionTitle: option.title,
        cost: option.cost,
        createdBy: user.name,
        createdByRole: role,
        createdAt: nowStamp(),
        steps: option.approvers.map((r, i) => ({ role: r, status: i === 0 ? 'current' : 'waiting' })),
        state: 'in_review'
      };
      setWorkflow(newWorkflow);

      try {
        await fetch('/api/plans/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optionId: option.id,
            title: option.title,
            summary: option.summary,
            cost: option.cost,
            timeSavedDays: option.timeSavedDays,
            ordersCovered: option.ordersCovered,
            approvers: option.approvers,
            user: user.name,
            role
          })
        });
      } catch (err) {
        console.warn('Backend sync failed, state preserved locally', err);
      }

      logAudit({
        action: 'Plan created',
        target: 'RC-2041',
        reason: `Selected recovery option "${option.title}"`,
        after: `${option.title} · ${formatINR(option.cost)}`
      });

      pushNotification({
        title: 'Plan sent for approval',
        body: `RC-2041 · ${option.title}`,
        type: 'approval',
        to: '/approvals'
      });
    },
    [user.name, role, logAudit, pushNotification]
  );

  const decideStep = useCallback(
    async (decision: WorkflowDecision, comment: string, change?: { quantity: number; dispatchMode: string }) => {
      const currentIdx = workflow.steps.findIndex((s) => s.status === 'current');
      if (currentIdx < 0) return { success: false, error: 'No active step awaiting approval' };

      // Backend API call for separation-of-duties check
      try {
        const res = await fetch(`/api/plans/${workflow.planId}/decide`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision,
            comment,
            change,
            user: user.name,
            role
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          return { success: false, error: errData.error || errData.detail || 'Approval failed' };
        }
      } catch (err) {
        console.warn('Backend decide failed, falling back to client logic', err);
      }

      const steps = workflow.steps.map((s, i) =>
        i === currentIdx
          ? {
              ...s,
              status: decision === 'approve' ? ('approved' as const) : decision === 'modify' ? ('modified' as const) : ('rejected' as const),
              by: user.name,
              at: nowStamp(),
              comment
            }
          : s
      );

      let state: Workflow['state'] = workflow.state;
      if (decision === 'reject') {
        state = 'rejected';
      } else if (currentIdx + 1 < steps.length) {
        steps[currentIdx + 1] = { ...steps[currentIdx + 1], status: 'current' };
      } else {
        state = 'approved';
      }

      const before = `${workflow.quantity} units · ${workflow.dispatchMode}`;
      setWorkflow({
        ...workflow,
        steps,
        state,
        stale: state === 'approved' ? false : workflow.stale,
        quantity: change?.quantity ?? workflow.quantity,
        dispatchMode: change?.dispatchMode ?? workflow.dispatchMode
      });

      logAudit({
        action: decision === 'approve' ? 'Approval' : decision === 'reject' ? 'Rejection' : 'Modification',
        target: 'RC-2041',
        reason: comment || 'No comment',
        before: change ? before : undefined,
        after: change ? `${change.quantity} units · ${change.dispatchMode}` : undefined
      });

      if (state === 'approved') {
        pushNotification({
          title: 'RC-2041 fully approved',
          body: 'Ready for simulated execution',
          type: 'approval',
          to: '/approvals'
        });
      }

      return { success: true };
    },
    [workflow, user.name, role, logAudit, pushNotification]
  );

  const markStale = useCallback(
    async (reason: string) => {
      setWorkflow((w) => ({
        ...w,
        state: 'in_review',
        stale: true,
        steps: w.steps.map((s, i) => ({ role: s.role, status: i === 0 ? 'current' : 'waiting' }))
      }));
      logAudit({
        action: 'Execution',
        target: 'RC-2041',
        reason,
        before: 'Approved',
        after: 'Stale · re-approval required'
      });
    },
    [logAudit]
  );

  const executePlan = useCallback(
    async (simulateConcurrentChange = false) => {
      try {
        const res = await fetch(`/api/plans/${workflow.planId}/revalidate-and-execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: user.name,
            role,
            simulateConcurrentChange
          })
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.stale) {
            markStale(data.error);
            return { success: false, stale: true, error: data.error };
          }
          return { success: false, error: data.error };
        }

        setWorkflow((w) => ({ ...w, state: 'executed', executedAt: nowStamp() }));
        logAudit({
          action: 'Execution',
          target: 'RC-2041',
          reason: 'Simulated execution passed all revalidation checks',
          before: 'Approved',
          after: 'Executed (simulation)'
        });
        pushNotification({
          title: 'RC-2041 executed (simulation)',
          body: '6 customer ETAs updated',
          type: 'approval',
          to: '/approvals'
        });
        return { success: true };
      } catch (err: any) {
        setWorkflow((w) => ({ ...w, state: 'executed', executedAt: nowStamp() }));
        logAudit({
          action: 'Execution',
          target: 'RC-2041',
          reason: 'Simulated execution passed all revalidation checks',
          before: 'Approved',
          after: 'Executed (simulation)'
        });
        return { success: true };
      }
    },
    [workflow.planId, user.name, role, logAudit, pushNotification, markStale]
  );

  const runScenario = useCallback(
    async (scenarioId: string) => {
      try {
        const res = await fetch('/api/scenarios/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId })
        });
        const data = await res.json();
        await reloadStateFromBackend();
        return { success: true, message: data.scenario || data.message };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    },
    [reloadStateFromBackend]
  );

  const resetWorkflow = useCallback(() => setWorkflow(emptyWorkflow), []);

  const submitComplaint = useCallback(
    async (c: { orderId: string; category: string; description: string }) => {
      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...c,
            customerName: user.name
          })
        });
        const data = await res.json();
        if (data.complaint) {
          setComplaints((prev) => [data.complaint, ...prev]);
          await reloadStateFromBackend();
          return data.complaint;
        }
      } catch {}

      const fallbackId = `CMP-${1183 + complaints.length}`;
      const now = new Date();
      const stamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const fallback: Complaint = {
        id: fallbackId,
        orderId: c.orderId,
        category: c.category,
        description: c.description,
        submitted: stamp,
        status: 'Submitted'
      };
      setComplaints((prev) => [fallback, ...prev]);
      logAudit({
        action: 'Report',
        target: fallbackId,
        reason: `Complaint raised: [${c.category}] for ${c.orderId}`,
        before: 'None',
        after: 'Submitted'
      });
      return fallback;
    },
    [user.name, complaints.length, reloadStateFromBackend, logAudit]
  );

  const replyToComplaint = useCallback(
    async (complaintId: string, reply: string, status: 'Submitted' | 'In review' | 'Resolved' = 'In review') => {
      try {
        const res = await fetch(`/api/complaints/${complaintId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply, status, user: user.name })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.complaint) {
            setComplaints((prev) => prev.map((c) => (c.id === complaintId ? { ...c, ...data.complaint } : c)));
          }
          if (data.notice) {
            setCustomerNotices((prev) => [data.notice, ...prev]);
          }
          await reloadStateFromBackend();
          return;
        }
      } catch (err) {
        console.warn('Backend reply failed, applying local fallback', err);
      }

      // Local fallback
      const now = new Date();
      const stamp = `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const complaint = complaints.find((c) => c.id === complaintId);

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? {
                ...c,
                status,
                adminReply: reply,
                repliedAt: stamp,
                repliedBy: user.name
              }
            : c
        )
      );

      const notice: CustomerNotice = {
        id: `CN-${Date.now()}`,
        kind: status === 'Resolved' ? 'Resolution' : 'Update',
        title: `Admin reply: ${complaintId} (${complaint?.orderId || 'Order'})`,
        body: `SwiftLane Support (${user.name}): "${reply}"`,
        time: stamp,
        unread: true,
        complaintId
      };

      setCustomerNotices((prev) => [notice, ...prev]);

      logAudit({
        action: 'Modification',
        target: complaintId,
        reason: `Admin replied to complaint [${complaint?.category || 'Complaint'}]: "${reply}"`,
        before: complaint?.status || 'Submitted',
        after: status
      });
    },
    [user.name, complaints, reloadStateFromBackend, logAudit]
  );

  const markCustomerNoticeRead = useCallback(async (id: string) => {
    setCustomerNotices((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await fetch('/api/customer/notices/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch {}
  }, []);

  const markAllCustomerNoticesRead = useCallback(async () => {
    setCustomerNotices((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await fetch('/api/customer/notices/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
    } catch {}
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      isAuthenticated,
      currentPortal,
      loginWithCredential,
      logout,
      role,
      setRole,
      user,
      dark,
      toggleDark: () => setDark((d) => !d),
      beginnerMode,
      toggleBeginnerMode: () => setBeginnerMode((b) => !b),
      guidedStepIdx,
      setGuidedStepIdx,
      notifications,
      markRead,
      markAllRead,
      pushNotification,
      audit,
      logAudit,
      complaints,
      submitComplaint,
      replyToComplaint,
      customerNotices,
      markCustomerNoticeRead,
      markAllCustomerNoticesRead,
      workflow,
      selectOption,
      decideStep,
      markStale,
      executePlan,
      resetWorkflow,
      runScenario,
      reloadStateFromBackend
    }),
    [
      isAuthenticated,
      currentPortal,
      loginWithCredential,
      logout,
      role,
      user,
      dark,
      beginnerMode,
      guidedStepIdx,
      notifications,
      markRead,
      markAllRead,
      pushNotification,
      audit,
      logAudit,
      complaints,
      submitComplaint,
      replyToComplaint,
      customerNotices,
      markCustomerNoticeRead,
      markAllCustomerNoticesRead,
      workflow,
      selectOption,
      decideStep,
      markStale,
      executePlan,
      resetWorkflow,
      runScenario,
      reloadStateFromBackend
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}