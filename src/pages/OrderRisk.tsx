import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDownIcon,
  InfoIcon,
  ArrowRightIcon,
  SearchXIcon,
  SparklesIcon,
  BotIcon,
  SendIcon,
  ClockIcon,
  MapPinIcon,
  PackageIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  CheckCircle2Icon,
  ShieldCheckIcon,
  DollarSignIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { riskOrders } from '../data/riskOrders';
import { activeDisruption } from '../data/disruption';
import { RiskLevel, RiskOrder, AiOrderRiskSolution } from '../types/domain';
import { useElapsedSeconds } from '../hooks/useElapsedSeconds';
import { useSimulatedLoading } from '../hooks/useSimulatedLoading';
import { formatCountdown, formatINR } from '../utils/format';
import { riskFromScore, riskStyles, scoreOf } from '../utils/risk';
import { useApp } from '../contexts/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge, StatusChip } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Tabs';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Field, inputClass } from '../components/ui/Field';
import { cn } from '../utils/cn';

type SortBy = 'score' | 'deadline';
type LevelFilter = 'All' | RiskLevel;

export function OrderRisk() {
  const navigate = useNavigate();
  const { orders: dbOrders, solveOrderRiskWithAi, applyOrderAiSolution } = useApp();
  const elapsed = useElapsedSeconds();
  const loading = useSimulatedLoading(650);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [level, setLevel] = useState<LevelFilter>('All');
  const [expanded, setExpanded] = useState<string | null>('ORD-10482');

  // AI Solution Modal State
  const [selectedOrder, setSelectedOrder] = useState<RiskOrder | null>(null);
  const [isSolvingAi, setIsSolvingAi] = useState(false);
  const [aiSolution, setAiSolution] = useState<AiOrderRiskSolution | null>(null);
  const [editableEta, setEditableEta] = useState('');
  const [editableNotice, setEditableNotice] = useState('');
  const [editableAction, setEditableAction] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Sync orders with database state to ensure persistence across tabs and logins
  const effectiveOrders = useMemo(() => {
    if (!dbOrders || dbOrders.length === 0) return riskOrders;
    return riskOrders.map((ro) => {
      const match = dbOrders.find((d) => d.id === ro.id);
      if (!match) return ro;
      return {
        ...ro,
        customer: match.customer || ro.customer,
        area: match.area || ro.area,
        priority: match.priority || ro.priority,
        deadlineHours: match.deadlineHours ?? ro.deadlineHours,
        deadlineLabel: match.deadlineLabel || ro.deadlineLabel,
        quantity: match.quantity ?? ro.quantity,
        shortage: match.shortage ?? ro.shortage,
        status: match.status || ro.status,
        revisedEta: match.aiRevisedEta || match.revisedEta || ro.revisedEta,
        explanation: match.aiCustomerNotice || match.explanation || ro.explanation,
        aiSolutionApplied: match.aiSolutionApplied,
        aiAction: match.aiAction,
        aiRevisedEta: match.aiRevisedEta,
        aiCustomerNotice: match.aiCustomerNotice,
        aiAppliedAt: match.aiAppliedAt
      };
    });
  }, [dbOrders]);

  // Derived persistent resolved orders map from database
  const resolvedOrders = useMemo(() => {
    const map: Record<string, { revisedEta: string; action: string }> = {};
    effectiveOrders.forEach((o: any) => {
      if (o.aiSolutionApplied || o.aiAction) {
        map[o.id] = {
          revisedEta: o.aiRevisedEta || o.revisedEta || 'Today, revised',
          action: o.aiAction || o.explanation || 'Emergency line-haul transfer dispatched'
        };
      }
    });
    return map;
  }, [effectiveOrders]);

  const ranked = useMemo(() => [...effectiveOrders].sort((a, b) => scoreOf(b.factors) - scoreOf(a.factors)), [effectiveOrders]);
  const rows = useMemo(() => {
    const list = ranked.filter((o) => level === 'All' || riskFromScore(scoreOf(o.factors)) === level);
    return sortBy === 'deadline' ? [...list].sort((a, b) => a.deadlineHours - b.deadlineHours) : list;
  }, [ranked, level, sortBy]);

  const critical = ranked.filter((o) => riskFromScore(scoreOf(o.factors)) === 'Critical').length;
  const earliest = Math.min(...effectiveOrders.map((o) => o.deadlineHours));

  const handleOpenAiModal = async (order: RiskOrder) => {
    setSelectedOrder(order);
    setIsSolvingAi(true);
    setAiSolution(null);

    try {
      const solution = await solveOrderRiskWithAi(order);
      setAiSolution(solution);
      setEditableEta(solution.revisedSlaWindow);
      setEditableNotice(solution.customerNoticeDraft);
      setEditableAction(solution.recommendedAction);
    } catch (err: any) {
      toast.error('AI recovery planning failed', {
        description: err.message || 'Please check your connection and try again.'
      });
      // Fallback
      setEditableEta('Today, by 18:30 IST');
      setEditableNotice(
        `SwiftLane Logistics Update: An upstream manufacturing delay at Hosur temporarily impacted your delivery. Replacement certified stock has been reallocated from our regional hub to complete your order today.`
      );
      setEditableAction(
        `Dispatch ${order.shortage} units ICM-220 from Bengaluru WH-BLR-02 via express freight corridor NH44/NH48.`
      );
    } finally {
      setIsSolvingAi(false);
    }
  };

  const handleApplySolution = async () => {
    if (!selectedOrder) return;
    setIsApplying(true);

    try {
      await applyOrderAiSolution(selectedOrder.id, {
        revisedEta: editableEta.trim(),
        customerExplanation: editableNotice.trim(),
        actionTaken: editableAction.trim()
      });

      setResolvedOrders((prev) => ({
        ...prev,
        [selectedOrder.id]: {
          revisedEta: editableEta.trim(),
          action: editableAction.trim()
        }
      }));

      toast.success(`AI Recovery Applied for ${selectedOrder.id}`, {
        description: `Customer (${selectedOrder.customer}) portal updated with revised ETA "${editableEta}". Action logged in audit trail.`
      });

      setSelectedOrder(null);
      setAiSolution(null);
    } catch (err: any) {
      toast.error('Failed to apply recovery resolution: ' + err.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Order risk ranking & AI recovery"
        breadcrumbs={[{ label: 'Impact trace', to: '/impact' }, { label: activeDisruption.id }, { label: 'Order risk' }]}
        description="Orders exposed to the SHP-7731 shortage. Click any order to diagnose why it is delayed, view exact specifications, and solve with Gemini AI."
        actions={
          <Button icon={<ArrowRightIcon className="h-4 w-4" />} onClick={() => navigate('/recovery')}>
            Compare recovery options
          </Button>
        }
      />

      <dl className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-line bg-surface px-5 py-4 shadow-card md:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Orders at risk</dt>
          <dd className="text-xl font-semibold tabular-nums text-ink">{riskOrders.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Critical</dt>
          <dd className="text-xl font-semibold tabular-nums text-risk-critical-ink">{critical}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Units short</dt>
          <dd className="text-xl font-semibold tabular-nums text-ink">{riskOrders.reduce((s, o) => s + o.shortage, 0)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">First SLA breach in</dt>
          <dd className="text-xl font-semibold tabular-nums text-ink">{formatCountdown(earliest * 3600 - elapsed)}</dd>
        </div>
      </dl>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <Segmented<LevelFilter>
            label="Filter by risk"
            value={level}
            onChange={setLevel}
            options={[
              { id: 'All', label: 'All' },
              { id: 'Critical', label: 'Critical' },
              { id: 'High', label: 'High' },
              { id: 'Moderate', label: 'Moderate' },
              { id: 'Low', label: 'Low' }
            ]}
          />

          <div className="flex items-center gap-2 text-[13px] text-muted">
            Sort by
            <Segmented<SortBy>
              label="Sort orders"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { id: 'score', label: 'Risk score' },
                { id: 'deadline', label: 'Deadline' }
              ]}
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState icon={SearchXIcon} title={`No ${level} orders`} body="No orders in this disruption fall into this risk band." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="w-12 px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Order & Customer</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">SLA Deadline</th>
                  <th className="px-4 py-3 text-right font-medium">Shortage</th>
                  <th className="px-4 py-3 font-medium">Risk score</th>
                  <th className="px-4 py-3 font-medium">Status / Action</th>
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">Expand</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    rank={ranked.indexOf(o) + 1}
                    elapsed={elapsed}
                    open={expanded === o.id}
                    onToggle={() => setExpanded((e) => (e === o.id ? null : o.id))}
                    onSolveAi={() => handleOpenAiModal(o)}
                    resolved={resolvedOrders[o.id]}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Gemini AI Resolution Modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => {
            if (!isSolvingAi && !isApplying) {
              setSelectedOrder(null);
              setAiSolution(null);
            }
          }}
          title={`Gemini AI Recovery: ${selectedOrder.id} · ${selectedOrder.customer}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Order Specification Banner */}
            <div className="rounded-xl border border-line bg-surface-2 p-4 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-ink">{selectedOrder.id}</span>
                  <StatusChip tone={selectedOrder.priority === 'P1' ? 'danger' : 'orange'}>
                    {selectedOrder.priority}
                  </StatusChip>
                  <span className="text-muted">· {selectedOrder.customer}</span>
                </div>
                <span className="text-risk-critical-ink font-semibold">
                  Deficit: {selectedOrder.shortage} / {selectedOrder.quantity} units ICM-220
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-muted pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="h-3.5 w-3.5" /> {selectedOrder.area}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5" /> Deadline: {selectedOrder.deadlineLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <PackageIcon className="h-3.5 w-3.5" /> SKU: ICM-220 Control Module
                </span>
              </div>
            </div>

            {isSolvingAi ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <RefreshCwIcon className="h-8 w-8 text-accent animate-spin" />
                <p className="text-sm font-semibold text-ink">Analyzing Supply Chain Network with Gemini AI...</p>
                <p className="text-xs text-muted text-center max-w-md">
                  Correlating upstream SMT oven delay at Hosur, regional warehouse buffers (Bengaluru WH-BLR-02), and customer production shift requirements.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiSolution && (
                  <div className="space-y-3">
                    {/* Diagnostic Summary */}
                    <div className="rounded-lg border border-line bg-surface p-3 text-xs">
                      <span className="font-semibold text-ink block mb-1">🔍 Problem Diagnostic:</span>
                      <p className="text-ink-2 leading-relaxed">{aiSolution.problemAnalysis}</p>
                    </div>

                    {/* Action & Contingency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
                        <span className="font-semibold text-accent-ink block mb-1">🚀 Recommended Logistics Action:</span>
                        <p className="text-ink-2 leading-relaxed">{aiSolution.recommendedAction}</p>
                      </div>

                      <div className="rounded-lg border border-line bg-surface-2 p-3">
                        <span className="font-semibold text-ink block mb-1">🔄 Alternative Contingency:</span>
                        <p className="text-ink-2 leading-relaxed">{aiSolution.alternativeFulfillment}</p>
                      </div>
                    </div>

                    {/* Cost & Mitigation */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <ShieldCheckIcon className="h-4 w-4 text-risk-low" /> {aiSolution.riskMitigation}
                      </span>
                      <span className="font-semibold tabular-nums text-ink">
                        Estimated Cost: {formatINR(aiSolution.estimatedCost)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Editable Fields for Admin */}
                <div className="space-y-3 border-t border-line pt-4">
                  <Field
                    label="Logistics Action Directive"
                    htmlFor="action-directive"
                    hint="Operational command for regional hub line-haul dispatch"
                    required
                  >
                    <textarea
                      id="action-directive"
                      rows={2}
                      value={editableAction}
                      onChange={(e) => setEditableAction(e.target.value)}
                      className={`${inputClass} text-xs font-mono`}
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Revised Delivery SLA Window"
                      htmlFor="revised-window"
                      hint="Updated time committed to customer"
                      required
                    >
                      <input
                        id="revised-window"
                        type="text"
                        value={editableEta}
                        onChange={(e) => setEditableEta(e.target.value)}
                        className={`${inputClass} text-xs`}
                      />
                    </Field>

                    <Field
                      label="Customer Notice (Dispatched to Portal)"
                      htmlFor="customer-notice"
                      hint="Live explanation shown in Customer Portal"
                      required
                    >
                      <input
                        id="customer-notice"
                        type="text"
                        value={editableNotice}
                        onChange={(e) => setEditableNotice(e.target.value)}
                        className={`${inputClass} text-xs`}
                      />
                    </Field>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-line pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedOrder(null);
                      setAiSolution(null);
                    }}
                    disabled={isApplying}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleApplySolution}
                    disabled={isApplying || !editableEta.trim() || !editableNotice.trim()}
                    icon={<SendIcon className="h-4 w-4" />}
                  >
                    {isApplying ? 'Applying & Dispatching Notice...' : 'Apply Solution & Notify Customer'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function OrderRow({
  order,
  rank,
  elapsed,
  open,
  onToggle,
  onSolveAi,
  resolved
}: {
  order: RiskOrder;
  rank: number;
  elapsed: number;
  open: boolean;
  onToggle: () => void;
  onSolveAi: () => void;
  resolved?: { revisedEta: string; action: string };
}) {
  const score = scoreOf(order.factors);
  const level = riskFromScore(score);
  const remaining = order.deadlineHours * 3600 - elapsed;

  return (
    <>
      <tr
        className={cn('cursor-pointer border-b border-line transition-colors duration-150 hover:bg-surface-2', open && 'bg-surface-2/60')}
        onClick={onToggle}
      >
        <td className="px-4 py-3 tabular-nums text-muted">{rank}</td>
        <td className="px-4 py-3">
          <p className="font-medium text-ink">{order.id}</p>
          <p className="text-xs text-muted">
            {order.customer} · {order.area}
          </p>
        </td>
        <td className="px-4 py-3">
          <StatusChip tone={order.priority === 'P1' ? 'danger' : order.priority === 'P2' ? 'orange' : 'neutral'}>
            {order.priority}
          </StatusChip>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <p className={cn('font-medium tabular-nums', order.deadlineHours <= 26 ? 'text-risk-critical-ink' : 'text-ink')}>
            {formatCountdown(remaining)}
          </p>
          <p className="text-xs text-muted">{order.deadlineLabel}</p>
        </td>
        <td className="px-4 py-3 text-right tabular-nums text-ink">
          {order.shortage}
          <span className="text-muted"> / {order.quantity}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 text-right text-base font-semibold tabular-nums text-ink">{score}</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
              <div className={cn('h-full rounded-full', riskStyles[level].bar)} style={{ width: `${score}%` }} />
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          {resolved ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-risk-low-ink">
              <CheckCircle2Icon className="h-3.5 w-3.5 text-risk-low" /> Resolved
            </span>
          ) : (
            <RiskBadge level={level} />
          )}
        </td>
        <td className="px-4 py-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-expanded={open}
            aria-label={`Explain score for ${order.id}`}
            className="rounded-md p-1 text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
          >
            <ChevronDownIcon className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
          </button>
        </td>
      </tr>

      <AnimatePresence initial={false}>
        {open && (
          <tr className="border-b border-line bg-surface-2/40">
            <td colSpan={8} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-4 px-4 py-5 md:px-12">
                  {/* Detailed Order Specifications */}
                  <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="text-muted block text-[11px] uppercase tracking-wider">Ordered Item</span>
                      <span className="font-semibold text-ink text-sm mt-0.5 block">Industrial Control Module (ICM-220)</span>
                      <span className="text-muted text-[11px]">Primary SKU: ICM-220</span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px] uppercase tracking-wider">Demand Deficit</span>
                      <span className="font-semibold text-risk-critical-ink text-sm mt-0.5 block">
                        {order.shortage} units missing / {order.quantity} units total
                      </span>
                      <span className="text-muted text-[11px]">0 units allocated at Chennai Hub</span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px] uppercase tracking-wider">Delivery Destination</span>
                      <span className="font-semibold text-ink text-sm mt-0.5 block">{order.area}</span>
                      <span className="text-muted text-[11px]">Customer: {order.customer}</span>
                    </div>

                    <div>
                      <span className="text-muted block text-[11px] uppercase tracking-wider">SLA Deadline Time</span>
                      <span className="font-semibold text-ink text-sm mt-0.5 block">{order.deadlineLabel}</span>
                      <span className="text-risk-critical-ink font-medium text-[11px]">Breach in: {formatCountdown(remaining)}</span>
                    </div>
                  </div>

                  {/* Why this order is getting delayed (Disruption Root Cause) */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
                    <div className="flex items-center justify-between pb-1">
                      <span className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                        <AlertTriangleIcon className="h-4 w-4" /> Why is this order getting delayed?
                      </span>
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-400">Corridor DIS-2041</span>
                    </div>
                    <p className="mt-1 text-ink-2 leading-relaxed">
                      <strong>Root Cause:</strong> Upstream supplier <strong>Apex Components Ltd (Hosur)</strong> suffered an unplanned 4-day stoppage due to a reflow oven failure on SMT production line 3. Shipment <strong>SHP-7731</strong> (200 units) was halted at the factory gate.
                    </p>
                    <p className="mt-1.5 text-ink-2 leading-relaxed">
                      <strong>Regional Impact:</strong> Chennai Hub (WH-CHN-01) holds only <strong>35 units</strong> against <strong>155 units</strong> committed across 6 priority enterprise clients. {order.customer} has a <strong>{order.shortage}-unit deficit</strong> that will trigger a plant assembly line shutdown unless emergency inventory is rerouted.
                    </p>
                  </div>

                  {/* Solved Status or AI Solver Action */}
                  {resolved ? (
                    <div className="rounded-xl border border-risk-low/30 bg-risk-low/10 p-4 text-xs">
                      <div className="flex items-center justify-between font-semibold text-risk-low-ink pb-1">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2Icon className="h-4 w-4" /> AI Recovery Solution Applied & Active
                        </span>
                        <span className="bg-risk-low/20 px-2 py-0.5 rounded text-[11px]">
                          Customer ETA: {resolved.revisedEta}
                        </span>
                      </div>
                      <p className="text-ink mt-1">Action: {resolved.action}</p>
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<SparklesIcon className="h-3.5 w-3.5 text-accent-ink" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSolveAi();
                          }}
                        >
                          Update / Re-solve with AI
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4">
                      <div>
                        <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                          <SparklesIcon className="h-4 w-4 text-accent-ink" /> Real-Time Gemini AI Recovery Agent
                        </h4>
                        <p className="text-xs text-muted mt-0.5">
                          Analyze the exact {order.shortage}-unit shortage for {order.customer}, calculate regional warehouse buffers (Bengaluru WH-BLR-02), and dispatch tailored resolution.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        icon={<SparklesIcon className="h-4 w-4 text-amber-300" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSolveAi();
                        }}
                      >
                        Solve with AI
                      </Button>
                    </div>
                  )}

                  {/* Factor Scoring Breakdown */}
                  <div className="grid gap-6 md:grid-cols-[1fr_260px] pt-1">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Risk Factors Breakdown</p>
                      <ul className="space-y-2.5">
                        {order.factors.map((f) => (
                          <li key={f.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_1fr_auto]">
                            <span className="text-xs font-medium text-ink">{f.label}</span>
                            <div className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-line sm:order-none sm:col-span-1">
                              <div className="h-full rounded-full bg-accent" style={{ width: `${(f.points / f.max) * 100}%` }} />
                            </div>
                            <span className="text-right text-xs tabular-nums text-ink">
                              <span className="font-semibold">+{f.points}</span>
                              <span className="text-muted"> / {f.max}</span>
                            </span>
                            <span className="order-4 col-span-2 text-[11px] text-muted sm:col-span-3 sm:col-start-2">{f.detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-line bg-surface p-4 text-[13px] text-ink-2">
                      <p className="flex items-center gap-1.5 font-medium text-ink">
                        <InfoIcon className="h-3.5 w-3.5" aria-hidden /> Score Methodology
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        Evaluated across deadline proximity (max 35), quantity shortage (25), customer priority SLA penalty (20), and corridor disruption severity (20).
                      </p>
                      <p className="mt-3 text-sm font-semibold text-ink">
                        Deterministic Total: {score} → <span className={riskStyles[level].text}>{level}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}