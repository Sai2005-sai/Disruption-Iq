import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FactoryIcon, ShipIcon, WarehouseIcon, BoxIcon, UsersIcon, SparklesIcon, RefreshCwIcon, ArrowRightIcon, ChevronRightIcon, CheckIcon } from 'lucide-react';
import { activeDisruption, affectedWarehouses, aiSummary, parallelChain, traceNodes, TraceNode } from '../data/disruption';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge, StatusChip } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../utils/cn';

const icons = [FactoryIcon, ShipIcon, WarehouseIcon, BoxIcon, UsersIcon];

export function ImpactTrace() {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState<string>('stock');
  const [regenerating, setRegenerating] = useState(false);
  const [summaryData, setSummaryData] = useState(aiSummary);
  const node = traceNodes.find((n) => n.id === activeNode) as TraceNode;

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/disruption-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disruptionId: activeDisruption.id })
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryData({
          headline: data.headline,
          body: data.body,
          bullets: data.bullets,
          confidence: data.confidence,
          sources: [data.source || 'Gemini 2.5 Flash', 'WMS cycle count 10:12', 'OMS order book']
        });
      }
    } catch {
      // Keep existing data
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Impact trace"
        breadcrumbs={[{ label: 'Disruption alerts', to: '/alerts' }, { label: activeDisruption.id }, { label: 'Impact trace' }]}
        description={activeDisruption.summary}
        meta={<RiskBadge level="High" label="Major" />}
        actions={
        <>
            <Button variant="secondary" onClick={() => navigate('/orders')}>
              Rank affected orders
            </Button>
            <Button icon={<ArrowRightIcon className="h-4 w-4" />} onClick={() => navigate('/recovery')}>
              Compare recovery options
            </Button>
          </>
        } />
      

      <Card className="mb-6 p-5 lg:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-ink">Disruption path</h2>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-risk-critical" /> Delayed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-risk-high" /> At risk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-risk-low" /> On track
            </span>
          </div>
        </div>

        <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0">
          {traceNodes.map((n, i) => {
            const Icon = icons[i];
            const active = n.id === activeNode;
            const tone = n.status === 'delayed' ? 'critical' : n.status === 'at-risk' ? 'high' : 'low';
            return (
              <React.Fragment key={n.id}>
                <li className="lg:min-w-0 lg:flex-1">
                  <button
                    onClick={() => setActiveNode(n.id)}
                    aria-pressed={active}
                    className={cn(
                      'flex h-full w-full flex-col rounded-xl border-2 p-4 text-left transition-[border-color,background-color] duration-150',
                      tone === 'critical' && (active ? 'border-risk-critical bg-risk-critical/10' : 'border-risk-critical/40 bg-risk-critical/5 hover:border-risk-critical/70'),
                      tone === 'high' && (active ? 'border-risk-high bg-risk-high/10' : 'border-risk-high/40 bg-risk-high/5 hover:border-risk-high/70')
                    )}>
                    
                    <span className="flex items-center justify-between">
                      <span className="text-xs text-muted">{n.stage}</span>
                      <Icon className={cn('h-4 w-4', tone === 'critical' ? 'text-risk-critical-ink' : 'text-risk-high-ink')} aria-hidden />
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-ink">{n.title}</span>
                    <span className="block text-xs text-muted">{n.subtitle}</span>
                    <span className={cn('mt-3 block text-[13px] font-medium', tone === 'critical' ? 'text-risk-critical-ink' : 'text-risk-high-ink')}>{n.metric}</span>
                  </button>
                </li>
                {i < traceNodes.length - 1 &&
                <li aria-hidden className="flex items-center justify-center py-0.5 lg:w-6 lg:py-0">
                    <ChevronRightIcon className="h-4 w-4 rotate-90 text-risk-critical-ink lg:rotate-0" />
                  </li>
                }
              </React.Fragment>);

          })}
        </ol>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="mt-4 rounded-lg bg-surface-2 px-4 py-3 text-sm text-ink-2">
            
            <span className="font-medium text-ink">{node.stage}: </span>
            {node.detail}
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-[13px] text-muted">
          <span className="mr-1">Unaffected parallel chain:</span>
          {parallelChain.map((c, i) =>
          <React.Fragment key={c}>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-ink-2">
                <span className="h-1.5 w-1.5 rounded-full bg-risk-low" aria-hidden />
                {c}
              </span>
              {i < parallelChain.length - 1 && <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />}
            </React.Fragment>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card as="section" className="lg:col-span-2">
          <CardHeader
            title={
            <span className="inline-flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-accent-ink" aria-hidden /> AI Disruption Summary
              </span>
            }
            action={
            <button
              onClick={regenerate}
              className="rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              aria-label="Regenerate summary">
              
                <RefreshCwIcon className={cn('h-4 w-4', regenerating && 'animate-spin')} />
              </button>
            } />
          
          <div className="p-5 pt-3">
            {regenerating ?
            <div className="space-y-2.5">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div> :

            <>
                <p className="text-[15px] font-medium leading-snug text-ink">{summaryData.headline}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{summaryData.body}</p>
                <ul className="mt-4 space-y-2">
                  {summaryData.bullets.map((b) =>
                <li key={b} className="flex gap-2 text-[13px] text-ink-2">
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-ink" aria-hidden />
                      {b}
                    </li>
                )}
                </ul>
                <div className="mt-5 border-t border-line pt-3 text-xs text-muted">
                  Confidence {Math.round(summaryData.confidence * 100)}% · Sources: {summaryData.sources.join(', ')}
                </div>
              </>
            }
          </div>
        </Card>

        <Card as="section" className="min-w-0 lg:col-span-3">
          <CardHeader title="Affected warehouses" description="ICM-220 · current on-hand vs. committed demand for the next 5 days" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-y border-line text-left text-xs text-muted">
                  <th className="px-5 py-2.5 font-medium">Warehouse</th>
                  <th className="px-3 py-2.5 text-right font-medium">Current</th>
                  <th className="px-3 py-2.5 text-right font-medium">Required</th>
                  <th className="px-3 py-2.5 font-medium">Coverage</th>
                  <th className="px-5 py-2.5 text-right font-medium">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {affectedWarehouses.map((w) => {
                  const coverage = Math.min(100, Math.round(w.current / w.required * 100));
                  const gap = w.current - w.required;
                  const level = coverage < 40 ? 'Critical' : coverage < 80 ? 'High' : 'Low';
                  return (
                    <tr key={w.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{w.name}</p>
                        <p className="text-xs text-muted">
                          {w.id} · {w.note}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink">{w.current}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-2">{w.required}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className={cn('h-full rounded-full', level === 'Critical' ? 'bg-risk-critical' : level === 'High' ? 'bg-risk-high' : 'bg-risk-low')}
                              style={{ width: `${coverage}%` }} />
                            
                          </div>
                          <span className="text-xs tabular-nums text-muted">{coverage}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {gap < 0 ? <RiskBadge level={level} label={`${gap} units`} /> : <StatusChip tone="success">+{gap} surplus</StatusChip>}
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>);

}