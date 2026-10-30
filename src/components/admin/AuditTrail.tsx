import React, { useMemo, useState } from 'react';
import { SearchIcon, HistoryIcon, ArrowRightIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AuditAction } from '../../types/domain';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusChip, Tone } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { inputClass } from '../ui/Field';

const actions: AuditAction[] = ['Report', 'Plan created', 'Approval', 'Rejection', 'Modification', 'Execution', 'Data update'];
const actionTone: Record<AuditAction, Tone> = {
  Report: 'info',
  'Plan created': 'accent',
  Approval: 'success',
  Rejection: 'danger',
  Modification: 'warning',
  Execution: 'orange',
  'Data update': 'neutral'
};

export function AuditTrail() {
  const { audit } = useApp();
  const [action, setAction] = useState<AuditAction | 'All'>('All');
  const [user, setUser] = useState('All');
  const [query, setQuery] = useState('');

  const users = useMemo(() => Array.from(new Set(audit.map((a) => a.user))), [audit]);
  const rows = audit.filter(
    (a) =>
    (action === 'All' || a.action === action) && (
    user === 'All' || a.user === user) && (
    !query || `${a.target} ${a.reason} ${a.before ?? ''} ${a.after ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <Card as="section">
      <div className="grid gap-3 border-b border-line p-4 md:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search target, reason, values…" className={`${inputClass} pl-9`} aria-label="Search audit trail" />
        </div>
        <select value={action} onChange={(e) => setAction(e.target.value as AuditAction | 'All')} className={inputClass} aria-label="Filter by action">
          <option value="All">All actions</option>
          {actions.map((a) =>
          <option key={a}>{a}</option>
          )}
        </select>
        <select value={user} onChange={(e) => setUser(e.target.value)} className={inputClass} aria-label="Filter by user">
          <option value="All">All users</option>
          {users.map((u) =>
          <option key={u}>{u}</option>
          )}
        </select>
      </div>

      {rows.length === 0 ?
      <EmptyState
        icon={HistoryIcon}
        title="No matching entries"
        body="Adjust filters to see more of the audit trail."
        action={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setAction('All');
            setUser('All');
            setQuery('');
          }}>
          
              Clear filters
            </Button>
        } /> :


      <ol className="px-5 py-5">
          {rows.map((a, i) =>
        <li key={a.id} className="relative flex gap-4 pb-6 last:pb-0">
              {i < rows.length - 1 && <span aria-hidden className="absolute left-[5px] top-4 h-full w-px bg-line" />}
              <span className="relative z-10 mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-surface bg-ink-2" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <StatusChip tone={actionTone[a.action]}>{a.action}</StatusChip>
                  <span className="text-sm font-medium text-ink">{a.target}</span>
                  <span className="text-xs text-muted">· {a.timestamp}</span>
                </div>
                <p className="mt-1 text-sm text-ink-2">{a.reason}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {a.user} · {a.role} · {a.id}
                </p>
                {(a.before || a.after) &&
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {a.before && <span className="rounded-md bg-risk-critical/10 px-2 py-1 font-mono text-risk-critical-ink line-through decoration-1">{a.before}</span>}
                    {a.before && a.after && <ArrowRightIcon className="h-3 w-3 text-muted" aria-hidden />}
                    {a.after && <span className="rounded-md bg-risk-low/10 px-2 py-1 font-mono text-risk-low-ink">{a.after}</span>}
                  </div>
            }
              </div>
            </li>
        )}
        </ol>
      }
    </Card>);

}