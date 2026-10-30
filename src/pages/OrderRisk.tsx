import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDownIcon, InfoIcon, ArrowRightIcon, SearchXIcon } from 'lucide-react';
import { riskOrders } from '../data/riskOrders';
import { activeDisruption } from '../data/disruption';
import { RiskLevel, RiskOrder } from '../types/domain';
import { useElapsedSeconds } from '../hooks/useElapsedSeconds';
import { useSimulatedLoading } from '../hooks/useSimulatedLoading';
import { formatCountdown } from '../utils/format';
import { riskFromScore, riskStyles, scoreOf } from '../utils/risk';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge, StatusChip } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Segmented } from '../components/ui/Tabs';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../utils/cn';

type SortBy = 'score' | 'deadline';
type LevelFilter = 'All' | RiskLevel;

export function OrderRisk() {
  const navigate = useNavigate();
  const elapsed = useElapsedSeconds();
  const loading = useSimulatedLoading(650);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [level, setLevel] = useState<LevelFilter>('All');
  const [expanded, setExpanded] = useState<string | null>('ORD-10482');

  const ranked = useMemo(() => [...riskOrders].sort((a, b) => scoreOf(b.factors) - scoreOf(a.factors)), []);
  const rows = useMemo(() => {
    const list = ranked.filter((o) => level === 'All' || riskFromScore(scoreOf(o.factors)) === level);
    return sortBy === 'deadline' ? [...list].sort((a, b) => a.deadlineHours - b.deadlineHours) : list;
  }, [ranked, level, sortBy]);

  const critical = ranked.filter((o) => riskFromScore(scoreOf(o.factors)) === 'Critical').length;
  const earliest = Math.min(...riskOrders.map((o) => o.deadlineHours));

  return (
    <>
      <PageHeader
        title="Order risk ranking"
        breadcrumbs={[{ label: 'Impact trace', to: '/impact' }, { label: activeDisruption.id }, { label: 'Order risk' }]}
        description="Orders exposed to the SHP-7731 shortage, ranked by a deterministic 0–100 risk score."
        actions={
        <Button icon={<ArrowRightIcon className="h-4 w-4" />} onClick={() => navigate('/recovery')}>
            Compare recovery options
          </Button>
        } />
      

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
            { id: 'Low', label: 'Low' }]
            } />
          
          <div className="flex items-center gap-2 text-[13px] text-muted">
            Sort by
            <Segmented<SortBy>
              label="Sort orders"
              value={sortBy}
              onChange={setSortBy}
              options={[
              { id: 'score', label: 'Risk score' },
              { id: 'deadline', label: 'Deadline' }]
              } />
            
          </div>
        </div>

        {loading ?
        <TableSkeleton rows={6} /> :
        rows.length === 0 ?
        <EmptyState icon={SearchXIcon} title={`No ${level} orders`} body="No orders in this disruption fall into this risk band." /> :

        <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="w-12 px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 text-right font-medium">Shortage</th>
                  <th className="px-4 py-3 font-medium">Risk score</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="w-10 px-4 py-3">
                    <span className="sr-only">Expand</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) =>
              <OrderRow
                key={o.id}
                order={o}
                rank={ranked.indexOf(o) + 1}
                elapsed={elapsed}
                open={expanded === o.id}
                onToggle={() => setExpanded((e) => e === o.id ? null : o.id)} />

              )}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </>);

}

function OrderRow({ order, rank, elapsed, open, onToggle }: {order: RiskOrder;rank: number;elapsed: number;open: boolean;onToggle: () => void;}) {
  const score = scoreOf(order.factors);
  const level = riskFromScore(score);
  const remaining = order.deadlineHours * 3600 - elapsed;

  return (
    <>
      <tr className={cn('cursor-pointer border-b border-line transition-colors duration-150 hover:bg-surface-2', open && 'bg-surface-2/60')} onClick={onToggle}>
        <td className="px-4 py-3 tabular-nums text-muted">{rank}</td>
        <td className="px-4 py-3">
          <p className="font-medium text-ink">{order.id}</p>
          <p className="text-xs text-muted">
            {order.customer} · {order.area}
          </p>
        </td>
        <td className="px-4 py-3">
          <StatusChip tone={order.priority === 'P1' ? 'danger' : order.priority === 'P2' ? 'orange' : 'neutral'}>{order.priority}</StatusChip>
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <p className={cn('font-medium tabular-nums', order.deadlineHours <= 26 ? 'text-risk-critical-ink' : 'text-ink')}>{formatCountdown(remaining)}</p>
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
          <RiskBadge level={level} />
        </td>
        <td className="px-4 py-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-expanded={open}
            aria-label={`Explain score for ${order.id}`}
            className="rounded-md p-1 text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
            
            <ChevronDownIcon className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
          </button>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open &&
        <tr className="border-b border-line bg-surface-2/40">
            <td colSpan={8} className="p-0">
              <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden">
              
                <div className="grid gap-6 px-4 py-5 md:grid-cols-[1fr_260px] md:px-16">
                  <div>
                    <p className="mb-3 text-sm font-semibold text-ink">Explain this score</p>
                    <ul className="space-y-3">
                      {order.factors.map((f) =>
                    <li key={f.label} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[180px_1fr_auto]">
                          <span className="text-sm text-ink">{f.label}</span>
                          <div className="order-3 col-span-2 h-1.5 overflow-hidden rounded-full bg-line sm:order-none sm:col-span-1">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${f.points / f.max * 100}%` }} />
                          </div>
                          <span className="text-right text-sm tabular-nums text-ink">
                            <span className="font-semibold">+{f.points}</span>
                            <span className="text-muted"> / {f.max}</span>
                          </span>
                          <span className="order-4 col-span-2 text-xs text-muted sm:col-span-3 sm:col-start-2">{f.detail}</span>
                        </li>
                    )}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-line bg-surface p-4 text-[13px] text-ink-2">
                    <p className="flex items-center gap-1.5 font-medium text-ink">
                      <InfoIcon className="h-3.5 w-3.5" aria-hidden /> How it’s calculated
                    </p>
                    <p className="mt-2 leading-relaxed">
                      Score = deadline (max 35) + shortage (25) + priority (20) + severity (20). Rules are fixed — the same inputs always produce the same score.
                    </p>
                    <p className="mt-3 text-sm font-semibold text-ink">
                      Total {score} → <span className={riskStyles[level].text}>{level}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        }
      </AnimatePresence>
    </>);

}