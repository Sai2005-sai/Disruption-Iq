import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XIcon, SparklesIcon, StarIcon, CircleAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import { recoveryOptions } from '../data/recoveryOptions';
import { activeDisruption } from '../data/disruption';
import { RecoveryOption } from '../types/domain';
import { useApp } from '../contexts/AppContext';
import { roleMeta } from '../utils/roles';
import { formatINR } from '../utils/format';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge, StatusChip } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { cn } from '../utils/cn';

const feasLabels: {key: keyof RecoveryOption['feasibility'];label: string;}[] = [
{ key: 'inventory', label: 'Inventory' },
{ key: 'deadline', label: 'Deadline' },
{ key: 'constraints', label: 'Constraints' }];


export function RecoveryOptions() {
  const navigate = useNavigate();
  const { workflow, selectOption } = useApp();
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState<RecoveryOption | null>(null);

  const isFeasible = (o: RecoveryOption) => Object.values(o.feasibility).every(Boolean);

  const choose = (o: RecoveryOption) => {
    if (!isFeasible(o)) return setConfirm(o);
    commit(o);
  };

  const commit = (o: RecoveryOption) => {
    selectOption(o);
    setConfirm(null);
    toast.success(`Plan ${activeDisruption.caseId} created`, { description: `${o.title} sent to ${roleMeta[o.approvers[0]].label}` });
    navigate('/approvals');
  };

  return (
    <>
      <PageHeader
        title="Recovery options"
        breadcrumbs={[{ label: 'Impact trace', to: '/impact' }, { label: activeDisruption.caseId }, { label: 'Recovery options' }]}
        description="Five generated plans for the 120-unit ICM-220 shortage at Chennai. Feasibility is verified against live inventory, deadlines and constraints."
        actions={
        <Button variant="secondary" icon={<SparklesIcon className="h-4 w-4" />} onClick={() => setDrawer(true)}>
            AI pros &amp; cons
          </Button>
        } />
      

      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 2xl:grid 2xl:grid-cols-5 2xl:overflow-visible">
        {recoveryOptions.map((o) => {
          const selected = workflow.optionId === o.id;
          const feasible = isFeasible(o);
          return (
            <Card
              key={o.id}
              as="article"
              className={cn(
                'flex w-[280px] shrink-0 snap-start flex-col p-5 2xl:w-auto',
                o.recommended && 'border-accent/60',
                selected && 'ring-2 ring-accent'
              )}>
              
              <div className="flex h-6 items-center justify-between">
                {o.recommended ?
                <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink">
                    <StarIcon className="h-3.5 w-3.5" aria-hidden /> Recommended
                  </span> :

                <span className="text-xs text-muted">Option</span>
                }
                {selected && <StatusChip tone="accent">Selected</StatusChip>}
              </div>
              <h2 className="mt-2 line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-ink">{o.title}</h2>
              <p className="mt-1 line-clamp-3 min-h-[3.75rem] text-[13px] leading-relaxed text-muted">{o.summary}</p>

              <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Cost</dt>
                  <dd className="font-semibold tabular-nums text-ink">{formatINR(o.cost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Time saved</dt>
                  <dd className="font-medium tabular-nums text-ink">{o.timeSavedDays} days</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Orders covered</dt>
                  <dd className="font-medium tabular-nums text-ink">
                    {o.ordersCovered}
                    <span className="text-muted"> / 12</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Remaining risk</dt>
                  <dd>
                    <RiskBadge level={o.remainingRisk} />
                  </dd>
                </div>
              </dl>

              <div className="mt-4 border-t border-line pt-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
                  {feasible ? <CheckIcon className="h-3.5 w-3.5 text-risk-low-ink" aria-hidden /> : <CircleAlertIcon className="h-3.5 w-3.5 text-risk-high-ink" aria-hidden />}
                  {feasible ? 'Feasibility verified' : 'Feasibility issue'}
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {feasLabels.map((f) => {
                    const ok = o.feasibility[f.key];
                    return (
                      <li key={f.key}>
                        <StatusChip tone={ok ? 'success' : 'danger'}>
                          {ok ? <CheckIcon className="h-3 w-3" aria-hidden /> : <XIcon className="h-3 w-3" aria-hidden />}
                          {f.label}
                        </StatusChip>
                      </li>);

                  })}
                </ul>
                <p className="mt-2 min-h-[2.5rem] text-xs leading-relaxed text-muted">{o.feasibilityNote}</p>
              </div>

              <div className="mt-3">
                <p className="text-xs text-muted">Approval required</p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{o.approvers.map((r) => roleMeta[r].label).join(' → ')}</p>
              </div>

              <Button className="mt-auto w-full" variant={o.recommended ? 'primary' : 'secondary'} onClick={() => choose(o)} disabled={selected}>
                {selected ? 'Selected' : 'Select option'}
              </Button>
            </Card>);

        })}
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="AI pros & cons comparison" description="Generated from verified feasibility data — review before approving">
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed text-ink-2">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-ink">
            <SparklesIcon className="h-4 w-4 text-accent-ink" aria-hidden /> Recommendation
          </p>
          Reallocating from Bengaluru is the only option that covers all 12 orders before the first deadline while passing every feasibility check. Splitting orders is a cheap fallback if Parent Company approval is delayed.
        </div>
        <div className="space-y-6">
          {recoveryOptions.map((o) =>
          <section key={o.id}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{o.title}</h3>
                <RiskBadge level={o.remainingRisk} />
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <ul className="space-y-1.5">
                  {o.pros.map((p) =>
                <li key={p} className="flex gap-2 text-[13px] text-ink-2">
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-low-ink" aria-hidden />
                      {p}
                    </li>
                )}
                </ul>
                <ul className="space-y-1.5">
                  {o.cons.map((c) =>
                <li key={c} className="flex gap-2 text-[13px] text-ink-2">
                      <XIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-risk-critical-ink" aria-hidden />
                      {c}
                    </li>
                )}
                </ul>
              </div>
            </section>
          )}
        </div>
      </Drawer>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Select a plan that fails feasibility?"
        description={confirm?.title}
        footer={
        <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => confirm && commit(confirm)}>
              Select anyway
            </Button>
          </>
        }>
        
        <p className="text-sm text-ink-2">
          This option fails{' '}
          <span className="font-medium text-ink">
            {confirm &&
            feasLabels.
            filter((f) => !confirm.feasibility[f.key]).
            map((f) => f.label.toLowerCase()).
            join(' and ')}
          </span>{' '}
          checks: {confirm?.feasibilityNote}. Approvers will see this warning, and it will be re-checked before execution.
        </p>
      </Modal>
    </>);

}