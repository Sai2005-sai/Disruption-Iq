import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDownIcon, SearchIcon, SearchXIcon, SirenIcon, SparklesIcon, MousePointerClickIcon } from 'lucide-react';
import { toast } from 'sonner';
import { alerts as seedAlerts } from '../data/alerts';
import { activeDisruption } from '../data/disruption';
import { AlertSource, DisruptionAlert, Severity } from '../types/domain';
import { useApp } from '../contexts/AppContext';
import { useSimulatedLoading } from '../hooks/useSimulatedLoading';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { minutesAgoLabel } from '../utils/format';
import { severityRank, severityToRisk, riskStyles } from '../utils/risk';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SeverityBadge, StatusChip, Tone } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Drawer } from '../components/ui/Drawer';
import { inputClass } from '../components/ui/Field';
import { cn } from '../utils/cn';

type SortKey = 'detected' | 'severity' | 'id';
const statusTone: Record<DisruptionAlert['status'], Tone> = { New: 'info', Classified: 'warning', 'Case created': 'accent', Resolved: 'success' };
const severities: Severity[] = ['Minor', 'Moderate', 'Major', 'Critical'];

export function Alerts() {
  const navigate = useNavigate();
  const { logAudit } = useApp();
  const loading = useSimulatedLoading(650);
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const [rows, setRows] = useState<DisruptionAlert[]>(seedAlerts);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<AlertSource | 'All'>('All');
  const [sort, setSort] = useState<{key: SortKey;dir: 1 | -1;}>({ key: 'detected', dir: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.
    filter((r) => (source === 'All' || r.source === source) && (!q || `${r.id} ${r.title} ${r.reference}`.toLowerCase().includes(q))).
    sort((a, b) => {
      const v = sort.key === 'detected' ? a.minutesAgo - b.minutesAgo : sort.key === 'severity' ? severityRank[b.severity] - severityRank[a.severity] : b.id.localeCompare(a.id);
      return v * sort.dir;
    });
  }, [rows, query, source, sort]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const toggleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? s.dir === 1 ? -1 : 1 : 1 }));

  const update = (id: string, patch: Partial<DisruptionAlert>) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, ...patch } : r));

  const panel = selected &&
  <ClassifyPanel
    key={selected.id}
    alert={selected}
    onSave={(sev, reason) => {
      update(selected.id, { severity: sev, status: selected.status === 'New' ? 'Classified' : selected.status });
      logAudit({ action: 'Modification', target: selected.id, reason, before: `Severity: ${selected.severity}`, after: `Severity: ${sev}` });
      toast.success(`${selected.id} classified as ${sev}`);
    }}
    onCreateCase={() => {
      update(selected.id, { status: 'Case created' });
      if (selected.id === activeDisruption.alertId) {
        toast.success(`Recovery case ${activeDisruption.caseId} created`, { description: 'Opening impact trace' });
        navigate('/impact');
      } else {
        toast.success(`Recovery case RC-${2042 + rows.filter((r) => r.status === 'Case created').length} created`, { description: selected.title });
      }
    }} />;



  const SortBtn = ({ k, children }: {k: SortKey;children: React.ReactNode;}) =>
  <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 font-medium transition-colors duration-150 hover:text-ink" aria-label={`Sort by ${k}`}>
      {children}
      <ArrowUpDownIcon className={cn('h-3 w-3', sort.key === k ? 'text-ink' : 'opacity-50')} aria-hidden />
    </button>;


  return (
    <>
      <PageHeader
        title="Disruption alerts"
        description="Every signal from suppliers, carrier webhooks and agent tickets. Classify severity, then open a recovery case."
        meta={<StatusChip tone="info">{rows.filter((r) => r.status === 'New').length} new</StatusChip>} />
      
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID, shipment, supplier…" className={`${inputClass} pl-9`} aria-label="Search alerts" />
            </div>
            <select value={source} onChange={(e) => setSource(e.target.value as AlertSource | 'All')} className={`${inputClass} sm:w-48`} aria-label="Filter by source">
              <option value="All">All sources</option>
              <option value="Supplier">Supplier</option>
              <option value="Carrier Webhook">Carrier Webhook</option>
              <option value="Agent Ticket">Agent Ticket</option>
            </select>
          </div>
          {loading ?
          <TableSkeleton rows={8} /> :
          visible.length === 0 ?
          <EmptyState
            icon={SearchXIcon}
            title="No alerts match"
            body="Try a different search or source filter."
            action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('');
                setSource('All');
              }}>
              
                  Clear filters
                </Button>
            } /> :


          <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-4 py-3">
                      <SortBtn k="id">Alert</SortBtn>
                    </th>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3">
                      <SortBtn k="severity">Severity</SortBtn>
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right">
                      <SortBtn k="detected">Detected</SortBtn>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map((r) =>
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(r.id)}
                  tabIndex={0}
                  aria-selected={r.id === selectedId}
                  className={cn('cursor-pointer transition-colors duration-150 hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2', r.id === selectedId && 'bg-accent/5')}>
                  
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{r.title}</p>
                        <p className="text-xs text-muted">
                          {r.id} · {r.reference}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-2">{r.source}</td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={r.severity} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip tone={statusTone[r.status]}>{r.status}</StatusChip>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <p className="tabular-nums text-ink-2">{r.detected}</p>
                        <p className="text-xs text-muted">{minutesAgoLabel(r.minutesAgo)}</p>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
          }
        </Card>

        {isDesktop ?
        <Card className="self-start xl:sticky xl:top-0">
            {panel || <EmptyState icon={MousePointerClickIcon} title="Select an alert" body="Choose a row to review details, classify severity and create a recovery case." />}
          </Card> :

        <Drawer open={!!selected} onClose={() => setSelectedId(null)} title={selected?.id ?? ''} description={selected?.source}>
            {panel}
          </Drawer>
        }
      </div>
    </>);

}

function ClassifyPanel({ alert, onSave, onCreateCase }: {alert: DisruptionAlert;onSave: (s: Severity, reason: string) => void;onCreateCase: () => void;}) {
  const [sev, setSev] = useState<Severity>(alert.severity === 'Unclassified' ? alert.suggested : alert.severity);
  const [reason, setReason] = useState(alert.severity === 'Unclassified' ? '' : alert.suggestionReason);
  const [error, setError] = useState('');
  const classified = alert.severity !== 'Unclassified';
  const caseOpen = alert.status === 'Case created';

  const save = () => {
    if (reason.trim().length < 8) return setError('Add a short reason (at least 8 characters) — it is stored in the audit trail.');
    setError('');
    onSave(sev, reason.trim());
  };

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-xs text-muted">
        <SirenIcon className="h-3.5 w-3.5" aria-hidden />
        {alert.id} · {alert.source} · {alert.location}
      </div>
      <h2 className="mt-2 text-base font-semibold text-ink">{alert.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{alert.description}</p>

      <div className="mt-4 flex gap-2 rounded-lg bg-surface-2 p-3 text-[13px]">
        <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden />
        <p className="text-ink-2">
          Suggested <span className="font-medium text-ink">{alert.suggested}</span> — {alert.suggestionReason}
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-[13px] font-medium text-ink-2">Severity</legend>
        <div className="grid grid-cols-2 gap-2">
          {severities.map((s) => {
            const risk = severityToRisk[s];
            const active = sev === s;
            return (
              <label
                key={s}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-[border-color,background-color] duration-150',
                  active ? riskStyles[risk].soft : 'border-line hover:bg-surface-2'
                )}>
                
                <input type="radio" name="severity" value={s} checked={active} onChange={() => setSev(s)} className="sr-only" />
                <span className={cn('h-2.5 w-2.5 rounded-full', riskStyles[risk].dot)} aria-hidden />
                <span className={cn('font-medium', active ? riskStyles[risk].text : 'text-ink')}>{s}</span>
              </label>);

          })}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor="classify-reason" className="mb-1.5 block text-[13px] font-medium text-ink-2">
          Reason
        </label>
        <textarea id="classify-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this severity?" className={inputClass} />
        {error && <p className="mt-1.5 text-xs text-risk-critical-ink">{error}</p>}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Button variant="secondary" onClick={save}>
          {classified ? 'Update classification' : 'Save classification'}
        </Button>
        <Button onClick={onCreateCase} disabled={!classified || caseOpen}>
          {caseOpen ? 'Recovery case open' : 'Create recovery case'}
        </Button>
        {!classified && <p className="text-center text-xs text-muted">Classify severity before creating a case.</p>}
      </div>
    </div>);

}