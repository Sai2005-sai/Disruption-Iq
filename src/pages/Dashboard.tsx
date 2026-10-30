import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { kpis, severityChart, supplierScores, recoveryTrend, pendingApprovals, initialFeed, feedPool, FeedAlert } from '../data/dashboard';
import { activeDisruption } from '../data/disruption';
import { useSimulatedLoading } from '../hooks/useSimulatedLoading';
import { chartTheme } from '../utils/chartTheme';
import { riskHex, riskStyles } from '../utils/risk';
import { formatINR } from '../utils/format';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../utils/cn';

function scoreColor(score: number): string {
  if (score >= 85) return riskHex.Low;
  if (score >= 70) return riskHex.Moderate;
  if (score >= 55) return riskHex.High;
  return riskHex.Critical;
}

export function Dashboard() {
  const { dark, workflow } = useApp();
  const navigate = useNavigate();
  const loading = useSimulatedLoading(700);
  const t = chartTheme(dark);
  const [feed, setFeed] = useState<FeedAlert[]>(initialFeed);
  const poolIdx = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const item = feedPool[poolIdx.current % feedPool.length];
      poolIdx.current += 1;
      const now = new Date();
      setFeed((f) => [{ ...item, id: `F-${Date.now()}`, time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` }, ...f].slice(0, 6));
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const approvals = [
  ...(workflow.state === 'in_review' ?
  [{ id: workflow.planId, title: workflow.optionTitle ?? '', amount: formatINR(workflow.cost), approver: 'In approval chain', age: 'Just now' }] :
  []),
  ...pendingApprovals];


  return (
    <>
      <PageHeader
        title="Operations overview"
        description="SwiftLane Logistics · South region · updated live"
        actions={
        <Button variant="secondary" onClick={() => navigate('/alerts')}>
            View all alerts
          </Button>
        } />
      

      {/* Beginner-friendly "What is DisruptionIQ?" & Live Story Card */}
      <Card className="mb-6 overflow-hidden border-accent/40 shadow-card">
        <div className="bg-gradient-to-r from-accent/15 via-surface to-accent/5 p-5 lg:p-6 border-b border-line">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-semibold text-accent-ink uppercase tracking-wide">
                  Live Disruption Case: DIS-2041
                </span>
                <RiskBadge level="High" label="Severity: Major" />
                <span className="text-muted">Detected: 29 Oct 2026, 09:18 • Hosur–Chennai Corridor</span>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-ink lg:text-2xl">
                Apex Components 5-Day Delay → 120-Unit Shortage at Chennai → 12 Customer Orders at Risk
              </h2>
              <p className="mt-1.5 text-sm text-ink-2 max-w-3xl leading-relaxed">
                A reflow oven breakdown at the supplier factory delayed shipment <strong>SHP-7731</strong>. 
                Chennai warehouse has only <strong>35 units</strong> on hand against <strong>155 required</strong>. 
                Three P1 customers (<em>Sundaram Motors</em>, <em>Coastal Pharma</em>, <em>Bharat Heavy Electricals</em>) face total production line stoppages unless stock is reallocated.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
              <Button icon={<ArrowRightIcon className="h-4 w-4" />} onClick={() => navigate('/impact')}>
                Step 1: Trace Impact
              </Button>
              <Button variant="secondary" onClick={() => navigate('/recovery')}>
                Step 2: Recovery Plans
              </Button>
            </div>
          </div>

          {/* Interactive 5-Step Pipeline */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <button
              onClick={() => navigate('/alerts')}
              className="group flex flex-col rounded-lg border border-line bg-surface p-3 text-left transition hover:border-accent hover:bg-surface-2"
            >
              <span className="text-[11px] font-semibold text-muted uppercase">1. Disruption Alert</span>
              <span className="mt-1 text-xs font-semibold text-ink group-hover:text-accent-ink">ALT-3108 (Apex)</span>
              <span className="mt-0.5 text-[11px] text-risk-high-ink font-medium">● Classified Major</span>
            </button>

            <button
              onClick={() => navigate('/orders')}
              className="group flex flex-col rounded-lg border border-line bg-surface p-3 text-left transition hover:border-accent hover:bg-surface-2"
            >
              <span className="text-[11px] font-semibold text-muted uppercase">2. Order Risk</span>
              <span className="mt-1 text-xs font-semibold text-ink group-hover:text-accent-ink">12 Orders at Risk</span>
              <span className="mt-0.5 text-[11px] text-risk-critical-ink font-medium">● 3 Critical P1 Orders</span>
            </button>

            <button
              onClick={() => navigate('/recovery')}
              className="group flex flex-col rounded-lg border border-line bg-surface p-3 text-left transition hover:border-accent hover:bg-surface-2"
            >
              <span className="text-[11px] font-semibold text-muted uppercase">3. Recovery Plans</span>
              <span className="mt-1 text-xs font-semibold text-ink group-hover:text-accent-ink">5 Options Evaluated</span>
              <span className="mt-0.5 text-[11px] text-risk-low-ink font-medium">✓ Bengaluru Reallocation</span>
            </button>

            <button
              onClick={() => navigate('/approvals')}
              className="group flex flex-col rounded-lg border border-line bg-surface p-3 text-left transition hover:border-accent hover:bg-surface-2"
            >
              <span className="text-[11px] font-semibold text-muted uppercase">4. Approvals</span>
              <span className="mt-1 text-xs font-semibold text-ink group-hover:text-accent-ink">SCM & Procurement</span>
              <span className="mt-0.5 text-[11px] text-muted">No self-approval</span>
            </button>

            <button
              onClick={() => navigate('/approvals')}
              className="group flex flex-col rounded-lg border border-line bg-surface p-3 text-left transition hover:border-accent hover:bg-surface-2"
            >
              <span className="text-[11px] font-semibold text-muted uppercase">5. Execution</span>
              <span className="mt-1 text-xs font-semibold text-ink group-hover:text-accent-ink">Pre-Flight Checks</span>
              <span className="mt-0.5 text-[11px] text-accent-ink font-medium">Atomic Simulation</span>
            </button>
          </div>
        </div>

        {/* Quick Scenario & Constraint Demo Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink-2">Run Demo Scenarios:</span>
            <button
              onClick={async () => {
                await fetch('/api/scenarios/run', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ scenarioId: 'scn-1' })
                });
                toast.success('Scenario 1 Activated: 5-Day Supplier Stoppage');
                navigate('/impact');
              }}
              className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2.5 py-1 font-medium text-accent-ink hover:bg-accent/25 transition"
            >
              ▶ Scenario 1: Supplier Stoppage (12 Orders)
            </button>
            <button
              onClick={async () => {
                await fetch('/api/scenarios/run', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ scenarioId: 'scn-2' })
                });
                toast.success('Scenario 2 Activated: Carrier Delay + Stock Shortage');
                navigate('/alerts');
              }}
              className="inline-flex items-center gap-1 rounded-md bg-info/15 px-2.5 py-1 font-medium text-info-ink hover:bg-info/25 transition"
            >
              ▶ Scenario 2: Carrier Delay (Delhivery)
            </button>
            <button
              onClick={() => navigate('/data')}
              className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2.5 py-1 font-medium text-ink-2 hover:bg-line transition"
            >
              Test Webhook Idempotency &amp; Bad Inputs →
            </button>
          </div>

          <button
            onClick={async () => {
              await fetch('/api/scenarios/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenarioId: 'reset' })
              });
              toast.info('Database reset to clean baseline.');
              window.location.reload();
            }}
            className="text-muted hover:text-ink underline"
          >
            Reset Database Baseline
          </button>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) =>
        <Link
          key={k.id}
          to={k.to}
          className={cn(
            'group rounded-xl border bg-surface p-4 shadow-card transition-[border-color] duration-150 hover:border-accent/50',
            k.tone === 'critical' ? 'border-risk-critical/40' : 'border-line'
          )}>
          
            {loading ?
          <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-24" />
              </div> :

          <>
                <p className="flex items-center justify-between text-[13px] text-muted">
                  {k.label}
                  <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-hidden />
                </p>
                <p className={cn('mt-1 text-2xl font-semibold tabular-nums tracking-tight', k.tone === 'critical' ? 'text-risk-critical-ink' : 'text-ink')}>{k.value}</p>
                <p className={cn('mt-0.5 text-xs', k.tone === 'positive' ? 'text-risk-low-ink' : 'text-muted')}>{k.delta}</p>
              </>
          }
          </Link>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title="Recovery progress" description="Share of at-risk orders with an executed recovery plan vs. target" />
            <div className="h-64 px-2 pb-4 pt-4">
              {loading ?
              <Skeleton className="mx-3 h-full" /> :

              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recoveryTrend} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={t.grid} vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={t.tooltip} />
                    <Line type="monotone" dataKey="target" name="Target" stroke={t.tick} strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="progress" name="Progress" stroke={t.accent} strokeWidth={2.5} dot={{ r: 3, fill: t.accent }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              }
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader title="Disruptions by severity" description="Last 7 days · 21 total" />
              <div className="h-56 px-2 pb-4 pt-4">
                {loading ?
                <Skeleton className="mx-3 h-full" /> :

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityChart} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={t.grid} vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.cursor }} />
                      <Bar dataKey="value" name="Disruptions" radius={[6, 6, 0, 0]} maxBarSize={44}>
                        {severityChart.map((s) =>
                      <Cell key={s.name} fill={riskHex[s.risk]} />
                      )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                }
              </div>
            </Card>
            <Card>
              <CardHeader title="Supplier performance" description="On-time, quality and notice score (0–100)" />
              <div className="h-56 px-2 pb-4 pt-4">
                {loading ?
                <Skeleton className="mx-3 h-full" /> :

                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supplierScores} layout="vertical" margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
                      <CartesianGrid stroke={t.grid} horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="supplier" width={112} tick={{ fill: t.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.cursor }} />
                      <Bar dataKey="score" name="Score" radius={[0, 6, 6, 0]} maxBarSize={18}>
                        {supplierScores.map((s) =>
                      <Cell key={s.supplier} fill={scoreColor(s.score)} />
                      )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                }
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Live alerts"
              action={
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  Streaming
                </span>
              } />
            
            <ul className="mt-3 divide-y divide-line">
              <AnimatePresence initial={false}>
                {feed.map((a) =>
                <motion.li
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
                  
                    <Link to="/alerts" className="flex gap-3 px-5 py-3 transition-colors duration-150 hover:bg-surface-2">
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', riskStyles[a.risk].dot)} aria-label={a.risk} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-ink">{a.title}</span>
                        <span className="block text-xs text-muted">{a.source}</span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted">{a.time}</span>
                    </Link>
                  </motion.li>
                )}
              </AnimatePresence>
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Pending approvals"
              action={
              <Link to="/approvals" className="text-[13px] font-medium text-accent-ink hover:underline">
                  Open
                </Link>
              } />
            
            <ul className="mt-3 divide-y divide-line pb-1">
              {approvals.map((p) =>
              <li key={p.id}>
                  <Link to="/approvals" className="flex items-start justify-between gap-3 px-5 py-3 transition-colors duration-150 hover:bg-surface-2">
                    <span className="min-w-0">
                      <span className="block text-sm text-ink">{p.title}</span>
                      <span className="block text-xs text-muted">
                        {p.id} · {p.approver} · {p.age}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums text-ink">{p.amount}</span>
                  </Link>
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </>);

}