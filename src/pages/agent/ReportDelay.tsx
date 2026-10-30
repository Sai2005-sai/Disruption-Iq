import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ImagePlusIcon, XIcon, CheckIcon, XCircleIcon, CircleDashedIcon, ShieldCheckIcon, SendIcon, CircleCheckIcon, CircleAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import { deliveries, delayReasons, recentTickets } from '../../data/deliveries';
import { AgentTicket } from '../../types/domain';
import { useApp } from '../../contexts/AppContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Field, inputClass } from '../../components/ui/Field';
import { cn } from '../../utils/cn';

interface Photo {
  name: string;
  url: string;
}

interface ActiveTicket {
  id: string;
  stage: 1 | 2 | 3;
  outcome: 'Resolved' | 'Escalated';
}

export function ReportDelay() {
  const [params] = useSearchParams();
  const { logAudit } = useApp();
  const [orderId, setOrderId] = useState(params.get('order') ?? 'ORD-10482');
  const [reasonId, setReasonId] = useState('');
  const [custom, setCustom] = useState('');
  const [minutes, setMinutes] = useState(45);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{reason?: string;custom?: string;}>({});
  const [ticket, setTicket] = useState<ActiveTicket | null>(null);
  const [tickets, setTickets] = useState<AgentTicket[]>(recentTickets);
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const reason = delayReasons.find((r) => r.id === reasonId);
  const isOther = reasonId === 'other';
  const selected = reasonId !== '';

  const checks = useMemo(
    () => [
    {
      label: 'Reason is on the approved minor-issue list',
      pass: selected ? !!reason?.minor : null,
      detail: !selected ? 'Select a reason' : isOther ? 'Custom reasons always need analyst review' : reason?.minor ? 'Covered by procedure MIP-04' : 'Not covered by MIP-04'
    },
    { label: 'Estimated delay is 60 minutes or less', pass: selected ? minutes <= 60 : null, detail: `${minutes} min reported` },
    { label: 'At least one photo attached', pass: selected ? photos.length > 0 : null, detail: `${photos.length} photo${photos.length === 1 ? '' : 's'} attached` },
    {
      label: 'No injury or vehicle safety risk',
      pass: selected ? !reason?.safety : null,
      detail: reason?.safety ? 'Safety-related reason — supervisor must review' : 'No safety flag on this reason'
    },
    { label: 'Agent within 500 m of planned route', pass: selected ? true : null, detail: 'GPS fix 120 m from route · ±8 m accuracy' }],

    [selected, reason, isOther, minutes, photos.length]
  );
  const allPass = checks.every((c) => c.pass === true);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imgs.length < files.length) toast.error('Only image files can be attached as evidence');
    setPhotos((p) => [...p, ...imgs.slice(0, 6 - p.length).map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))]);
  };

  const removePhoto = (i: number) =>
  setPhotos((p) => {
    URL.revokeObjectURL(p[i].url);
    return p.filter((_, idx) => idx !== i);
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!reasonId) next.reason = 'Choose the reason for this delay.';
    if (isOther && custom.trim().length < 5) next.custom = 'Describe the reason in at least 5 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const id = `TKT-${4472 + tickets.length - recentTickets.length}`;
    const outcome = allPass ? 'Resolved' : 'Escalated';
    const reasonLabel = isOther ? `Other: ${custom.trim()}` : reason?.label ?? '';
    setTicket({ id, stage: 1, outcome });
    toast.success(`${id} submitted`, { description: `${orderId} · ${reasonLabel}` });
    timers.current.push(window.setTimeout(() => setTicket((t) => t ? { ...t, stage: 2 } : t), 1100));
    timers.current.push(
      window.setTimeout(() => {
        setTicket((t) => t ? { ...t, stage: 3 } : t);
        setTickets((list) => [{ id, orderId, reason: reasonLabel, submitted: 'Just now', outcome }, ...list]);
        logAudit({ action: 'Report', target: id, reason: `${orderId} · ${reasonLabel}`, after: outcome === 'Resolved' ? 'Auto-resolved under MIP-04' : 'Escalated to Operations Analyst' });
        if (outcome === 'Resolved') toast.success(`${id} auto-resolved`, { description: 'Customer notified of revised ETA' });else
        toast.warning(`${id} escalated`, { description: 'An Operations Analyst will review within 15 min' });
      }, 2300)
    );
  };

  const stages = ticket ?
  [
  { label: 'Submitted', done: true },
  { label: 'Auto-checked', done: ticket.stage >= 2 },
  { label: ticket.outcome, done: ticket.stage >= 3, issue: ticket.outcome === 'Escalated' }] :

  [];

  return (
    <>
      <PageHeader
        title="Report a delay"
        breadcrumbs={[{ label: 'My deliveries', to: '/agent/deliveries' }, { label: 'Report delay' }]}
        description="Minor issues that pass every safety check are resolved automatically. Anything else goes to an analyst." />
      
      <div className="grid gap-6 lg:grid-cols-12">
        <Card as="section" className="lg:col-span-7">
          <form onSubmit={submit} className="space-y-5 p-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Order" htmlFor="order" required>
                <select id="order" value={orderId} onChange={(e) => setOrderId(e.target.value)} className={inputClass}>
                  {deliveries.
                  filter((d) => d.status !== 'Delivered').
                  map((d) =>
                  <option key={d.id} value={d.orderId}>
                        {d.orderId} · {d.customer}
                      </option>
                  )}
                </select>
              </Field>
              <Field label="Estimated delay (minutes)" htmlFor="minutes" hint="Minor issues must be 60 min or less">
                <input id="minutes" type="number" min={5} max={600} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 0)} className={inputClass} />
              </Field>
            </div>

            <Field label="Delay reason" htmlFor="reason" required error={errors.reason}>
              <select id="reason" value={reasonId} onChange={(e) => setReasonId(e.target.value)} className={inputClass}>
                <option value="">Select a reason…</option>
                {delayReasons.map((r) =>
                <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                )}
                <option value="other">Other: custom reason</option>
              </select>
            </Field>

            {isOther &&
            <Field label="Custom reason" htmlFor="custom" required error={errors.custom}>
                <input id="custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Gated community denied entry without pass" className={inputClass} />
              </Field>
            }

            <Field label="Notes for the operations team" htmlFor="notes">
              <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened, and what have you done so far?" className={inputClass} />
            </Field>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-ink-2">Photo evidence</p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  addFiles(e.dataTransfer.files);
                }}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors duration-150',
                  dragging ? 'border-accent bg-accent/5' : 'border-line'
                )}>
                
                <ImagePlusIcon className="h-6 w-6 text-muted" aria-hidden />
                <p className="mt-2 text-sm text-ink">
                  Drag photos here or{' '}
                  <button type="button" onClick={() => fileRef.current?.click()} className="font-medium text-accent-ink hover:underline">
                    browse
                  </button>
                </p>
                <p className="text-xs text-muted">JPG or PNG · up to 6 photos</p>
                <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} aria-label="Upload evidence photos" />
              </div>
              {photos.length > 0 &&
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {photos.map((p, i) =>
                <li key={p.url} className="group relative aspect-square overflow-hidden rounded-lg border border-line">
                      <img src={p.url} alt={`Evidence ${i + 1}: ${p.name}`} className="h-full w-full object-cover" />
                      <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 rounded-full bg-slate-950/70 p-1 text-white"
                    aria-label={`Remove ${p.name}`}>
                    
                        <XIcon className="h-3 w-3" />
                      </button>
                    </li>
                )}
                </ul>
              }
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                {selected ? allPass ? 'All checks pass — this will be auto-resolved.' : 'One or more checks fail — this will be escalated.' : 'Checks run as you fill the form.'}
              </p>
              <Button type="submit" icon={<SendIcon className="h-4 w-4" />} disabled={ticket?.stage === 1 || ticket?.stage === 2}>
                Submit ticket
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-5">
          <Card as="section">
            <CardHeader
              title="Approved minor-issue procedure"
              description="MIP-04 · deterministic checks, no AI involved"
              action={selected ? <StatusChip tone={allPass ? 'success' : 'warning'}>{allPass ? 'Auto-resolve' : 'Escalate'}</StatusChip> : undefined} />
            
            <ul className="space-y-1 p-3">
              {checks.map((c) =>
              <li key={c.label} className="flex items-start gap-3 rounded-lg px-2 py-2">
                  <span className="mt-0.5">
                    {c.pass === null ?
                  <CircleDashedIcon className="h-4 w-4 text-muted" aria-label="Not evaluated" /> :
                  c.pass ?
                  <CircleCheckIcon className="h-4 w-4 text-risk-low-ink" aria-label="Pass" /> :

                  <XCircleIcon className="h-4 w-4 text-risk-critical-ink" aria-label="Fail" />
                  }
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-ink">{c.label}</span>
                    <span className="block text-xs text-muted">{c.detail}</span>
                  </span>
                </li>
              )}
            </ul>
          </Card>

          <Card as="section">
            <CardHeader title="Ticket tracker" description={ticket ? `${ticket.id} · ${orderId}` : 'Your latest submission appears here'} />
            {ticket ?
            <ol className="relative mx-5 my-5 space-y-5">
                {stages.map((s, i) =>
              <li key={s.label} className="relative flex gap-3">
                    {i < stages.length - 1 && <span className={cn('absolute left-[11px] top-6 h-[calc(100%+4px)] w-px', s.done ? 'bg-accent' : 'bg-line')} aria-hidden />}
                    <motion.span
                  initial={false}
                  animate={{ scale: s.done ? 1 : 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    !s.done ? 'border-line bg-surface' : s.issue ? 'border-risk-high bg-risk-high text-white' : 'border-accent bg-accent text-navy'
                  )}>
                  
                      {s.done && (s.issue ? <CircleAlertIcon className="h-3.5 w-3.5" /> : <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />)}
                    </motion.span>
                    <div>
                      <p className={cn('text-sm font-medium', s.done ? 'text-ink' : 'text-muted')}>{s.label}</p>
                      <p className="text-xs text-muted">
                        {i === 0 && 'Received by DisruptionIQ'}
                        {i === 1 && (s.done ? '5 MIP-04 checks evaluated' : 'Running checks…')}
                        {i === 2 && (s.done ? s.issue ? 'Assigned to Priya Raman, Operations Analyst' : 'Customer notified · ETA updated' : 'Awaiting check results')}
                      </p>
                    </div>
                  </li>
              )}
              </ol> :

            <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted">
                <ShieldCheckIcon className="h-5 w-5" aria-hidden /> No ticket submitted in this session.
              </div>
            }
            <div className="border-t border-line">
              <p className="px-5 pb-1 pt-4 text-xs font-medium text-muted">Recent tickets</p>
              <ul className="divide-y divide-line">
                {tickets.slice(0, 4).map((t) =>
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm text-ink">
                        {t.id} · <span className="text-ink-2">{t.reason}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {t.orderId} · {t.submitted}
                      </p>
                    </div>
                    <StatusChip tone={t.outcome === 'Resolved' ? 'success' : t.outcome === 'Escalated' ? 'orange' : 'info'}>{t.outcome}</StatusChip>
                  </li>
                )}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </>);

}