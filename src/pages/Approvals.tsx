import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckIcon, XIcon, PencilIcon, ShieldAlertIcon, StampIcon, PlayIcon, TriangleAlertIcon, CircleCheckIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { recoveryOptions } from '../data/recoveryOptions';
import { activeDisruption } from '../data/disruption';
import { roleMeta } from '../utils/roles';
import { formatINR } from '../utils/format';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RiskBadge, StatusChip } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Field, inputClass } from '../components/ui/Field';
import { RevalidationModal } from '../components/approvals/RevalidationModal';
import { cn } from '../utils/cn';

type Dialog = 'reject' | 'modify' | 'execute' | null;

export function Approvals() {
  const navigate = useNavigate();
  const { workflow, role, user, setRole, decideStep, executePlan, markStale, resetWorkflow } = useApp();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [qty, setQty] = useState(workflow.quantity);
  const [mode, setMode] = useState(workflow.dispatchMode);

  const crumbs = [{ label: 'Recovery options', to: '/recovery' }, { label: workflow.planId }, { label: 'Approval' }];

  if (workflow.state === 'none') {
    return (
      <>
        <PageHeader title="Approval workflow" breadcrumbs={crumbs} />
        <Card>
          <EmptyState
            icon={StampIcon}
            title="No recovery plan awaiting approval"
            body={`Select one of the recovery options for ${activeDisruption.id} to start the approval chain.`}
            action={<Button onClick={() => navigate('/recovery')}>Choose a recovery option</Button>} />
          
        </Card>
      </>);

  }

  const option = recoveryOptions.find((o) => o.id === workflow.optionId);
  const currentIdx = workflow.steps.findIndex((s) => s.status === 'current');
  const current = currentIdx >= 0 ? workflow.steps[currentIdx] : null;
  const isCreator = workflow.createdBy === user.name;
  const isMyStep = !!current && current.role === role;
  const canAct = isMyStep && !isCreator;

  const approve = async () => {
    const res = await decideStep('approve', comment.trim());
    if (res && !res.success) {
      toast.error('Approval denied', { description: res.error });
      return;
    }
    toast.success(`Approved as ${roleMeta[role].label}`, {
      description: currentIdx + 1 < workflow.steps.length ? `Sent to ${roleMeta[workflow.steps[currentIdx + 1].role].label}` : 'Plan fully approved'
    });
    setComment('');
  };

  const reject = async () => {
    if (comment.trim().length < 8) return setCommentError('A rejection needs a reason of at least 8 characters.');
    const res = await decideStep('reject', comment.trim());
    if (res && !res.success) {
      toast.error('Rejection failed: ' + res.error);
      return;
    }
    toast.error('Plan rejected', { description: 'The plan owner has been notified' });
    setDialog(null);
    setComment('');
    setCommentError('');
  };

  const modify = async () => {
    if (comment.trim().length < 8) return setCommentError('Explain the modification (at least 8 characters).');
    const res = await decideStep('modify', comment.trim(), { quantity: qty, dispatchMode: mode });
    if (res && !res.success) {
      toast.error('Modification failed: ' + res.error);
      return;
    }
    toast.success('Plan modified and approved', { description: `${qty} units · ${mode}` });
    setDialog(null);
    setComment('');
    setCommentError('');
  };

  return (
    <>
      <PageHeader
        title="Approval workflow"
        breadcrumbs={crumbs}
        description={`${workflow.optionTitle} for ${activeDisruption.id}`}
        meta={
        <StatusChip tone={workflow.state === 'executed' ? 'success' : workflow.state === 'approved' ? 'accent' : workflow.state === 'rejected' ? 'danger' : 'info'} dot>
            {workflow.state === 'in_review' ? 'In review' : workflow.state === 'approved' ? 'Approved' : workflow.state === 'rejected' ? 'Rejected' : 'Executed (simulation)'}
          </StatusChip>
        } />
      

      {workflow.stale && workflow.state === 'in_review' &&
      <div className="mb-6 flex gap-3 rounded-xl border border-risk-critical/30 bg-risk-critical/10 p-4 text-sm">
          <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical-ink" aria-hidden />
          <div>
            <p className="font-medium text-ink">Stale plan — re-approval required</p>
            <p className="mt-0.5 text-ink-2">Revalidation found Bengaluru stock changed after approval. All approvers must review the plan again.</p>
          </div>
        </div>
      }

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5 lg:p-6">
            <h2 className="text-[15px] font-semibold text-ink">Approval chain</h2>
            <ol className="mt-5 flex flex-col gap-4 md:flex-row md:gap-0">
              {workflow.steps.map((s, i) => {
                const done = s.status === 'approved' || s.status === 'modified';
                return (
                  <li key={s.role} className="relative flex gap-3 md:flex-1 md:flex-col md:gap-3">
                    {i < workflow.steps.length - 1 &&
                    <span
                      aria-hidden
                      className={cn(
                        'absolute left-4 top-9 h-[calc(100%-12px)] w-px md:left-9 md:right-0 md:top-4 md:h-px md:w-auto',
                        done ? 'bg-accent' : 'bg-line'
                      )} />

                    }
                    <span
                      className={cn(
                        'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
                        done && 'border-accent bg-accent text-navy',
                        s.status === 'current' && 'border-primary bg-surface text-ink',
                        s.status === 'waiting' && 'border-line bg-surface text-muted',
                        s.status === 'rejected' && 'border-risk-critical bg-risk-critical text-white'
                      )}>
                      
                      {done ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : s.status === 'rejected' ? <XIcon className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 md:pr-4">
                      <p className="text-sm font-medium text-ink">{roleMeta[s.role].label}</p>
                      <p className="text-xs text-muted">
                        {s.status === 'waiting' && 'Waiting'}
                        {s.status === 'current' && `Awaiting ${roleMeta[s.role].user.name}`}
                        {s.status === 'approved' && `Approved by ${s.by} · ${s.at}`}
                        {s.status === 'modified' && `Modified & approved by ${s.by} · ${s.at}`}
                        {s.status === 'rejected' && `Rejected by ${s.by} · ${s.at}`}
                      </p>
                      {s.comment && <p className="mt-1 text-xs italic text-ink-2">“{s.comment}”</p>}
                    </div>
                  </li>);

              })}
            </ol>
          </Card>

          {workflow.state === 'in_review' && current &&
          <Card className="p-5 lg:p-6">
              <h2 className="text-[15px] font-semibold text-ink">Your decision</h2>
              {isCreator && isMyStep ?
            <div className="mt-4 flex gap-3 rounded-lg border border-risk-moderate/30 bg-risk-moderate/10 p-4 text-sm">
                  <ShieldAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-risk-moderate-ink" aria-hidden />
                  <div>
                    <p className="font-medium text-ink">Separation of duties: you cannot approve a plan you created</p>
                    <p className="mt-0.5 text-ink-2">
                      {user.name} created this plan. Another {roleMeta[current.role].label} must review it.
                    </p>
                  </div>
                </div> :
            !isMyStep ?
            <div className="mt-4 flex flex-col gap-3 rounded-lg bg-surface-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-ink-2">
                    This step is waiting on <span className="font-medium text-ink">{roleMeta[current.role].label}</span>. You’re viewing as {roleMeta[role].label}.
                  </p>
                  <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setRole(current.role);
                  toast.success(`Now viewing as ${roleMeta[current.role].label}`);
                }}>
                
                    Switch to {roleMeta[current.role].short}
                  </Button>
                </div> :
            null}

              <div className="mt-4">
                <Field label="Comment" htmlFor="decision-comment" hint="Stored in the audit trail with your decision">
                  <textarea
                  id="decision-comment"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!canAct}
                  placeholder="e.g. Within the quarterly transfer budget"
                  className={inputClass} />
                
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button icon={<CheckIcon className="h-4 w-4" />} disabled={!canAct} onClick={approve}>
                  Approve
                </Button>
                <Button variant="secondary" icon={<PencilIcon className="h-4 w-4" />} disabled={!canAct} onClick={() => setDialog('modify')}>
                  Modify
                </Button>
                <Button variant="secondary" className="text-risk-critical-ink" icon={<XIcon className="h-4 w-4" />} disabled={!canAct} onClick={() => setDialog('reject')}>
                  Reject
                </Button>
              </div>
            </Card>
          }

          {workflow.state === 'approved' &&
          <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
              <div>
                <h2 className="text-[15px] font-semibold text-ink">Ready to execute</h2>
                <p className="mt-0.5 text-sm text-muted">All approvals collected. Execution re-checks stock, deadlines, permissions and allocations first.</p>
              </div>
              <Button icon={<PlayIcon className="h-4 w-4" />} onClick={() => setDialog('execute')}>
                Execute (Simulation)
              </Button>
            </Card>
          }

          {workflow.state === 'executed' &&
          <Card className="p-5 lg:p-6">
              <div className="flex items-start gap-3">
                <CircleCheckIcon className="mt-0.5 h-5 w-5 text-risk-low-ink" aria-hidden />
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">Executed in simulation · {workflow.executedAt}</h2>
                  <p className="mt-0.5 text-sm text-muted">No real stock moved. These actions would have been dispatched:</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink-2 sm:pl-8">
                <li>Reservations placed against all 12 affected customer orders (including P1 Critical: ORD-10482, ORD-10477, ORD-10485)</li>
                <li>12 customers notified of revised ETAs with verified explanations</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-2 sm:pl-8">
                <Button variant="secondary" onClick={() => navigate('/customer/track')}>
                  Preview customer view
                </Button>
                <Button variant="ghost" onClick={() => navigate('/admin?tab=audit')}>
                  View audit trail
                </Button>
              </div>
            </Card>
          }

          {workflow.state === 'rejected' &&
          <Card>
              <EmptyState
              icon={XIcon}
              tone="error"
              title="Plan rejected"
              body="Choose a different recovery option or revise this one to restart the approval chain."
              action={
              <Button
                onClick={() => {
                  resetWorkflow();
                  navigate('/recovery');
                }}>
                
                    Back to recovery options
                  </Button>
              } />
            
            </Card>
          }
        </div>

        <Card as="aside" className="self-start">
          <CardHeader title="Plan summary" description={workflow.planId} />
          <dl className="space-y-3 p-5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Option</dt>
              <dd className="text-right font-medium text-ink">{workflow.optionTitle}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Cost</dt>
              <dd className="font-medium tabular-nums text-ink">{formatINR(workflow.cost)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Quantity</dt>
              <dd className="tabular-nums text-ink">{workflow.quantity} units</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Dispatch</dt>
              <dd className="text-right text-ink">{workflow.dispatchMode}</dd>
            </div>
            {option &&
            <div className="flex items-center justify-between">
                <dt className="text-muted">Remaining risk</dt>
                <dd>
                  <RiskBadge level={option.remainingRisk} />
                </dd>
              </div>
            }
            <div className="border-t border-line pt-3">
              <dt className="text-muted">Created by</dt>
              <dd className="mt-1 flex items-center gap-2 text-ink">
                <UserIcon className="h-3.5 w-3.5 text-muted" aria-hidden />
                {workflow.createdBy} · {workflow.createdByRole && roleMeta[workflow.createdByRole].label}
              </dd>
              <dd className="text-xs text-muted">{workflow.createdAt}</dd>
            </div>
          </dl>
          <div className="border-t border-line px-5 py-3 text-xs text-muted">
            <Link to="/recovery" className="text-accent-ink hover:underline">
              Compare all options
            </Link>
          </div>
        </Card>
      </div>

      <Modal
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        title="Reject this plan?"
        description="The plan owner is notified and the chain stops."
        footer={
        <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={reject}>
              Reject plan
            </Button>
          </>
        }>
        
        <Field label="Reason" htmlFor="reject-reason" required error={commentError}>
          <textarea id="reject-reason" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} placeholder="Why is this plan being rejected?" />
        </Field>
      </Modal>

      <Modal
        open={dialog === 'modify'}
        onClose={() => setDialog(null)}
        title="Modify and approve"
        description="Changes are recorded with before/after values."
        footer={
        <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={modify}>Save &amp; approve</Button>
          </>
        }>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Transfer quantity" htmlFor="mod-qty">
            <input id="mod-qty" type="number" min={1} max={180} value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} className={inputClass} />
          </Field>
          <Field label="Dispatch mode" htmlFor="mod-mode">
            <select id="mod-mode" value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
              <option>Standard road freight</option>
              <option>Express road freight</option>
              <option>Dedicated vehicle</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Reason for change" htmlFor="mod-reason" required error={commentError}>
            <textarea id="mod-reason" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} placeholder="e.g. Use express freight to add buffer before ORD-10482" />
          </Field>
        </div>
      </Modal>

      <RevalidationModal
        open={dialog === 'execute'}
        onClose={() => setDialog(null)}
        role={role}
        quantity={workflow.quantity}
        onExecute={async (simulateConcurrentChange) => {
          const res = await executePlan(simulateConcurrentChange);
          setDialog(null);
          if (res.stale) {
            toast.error('Plan marked stale', { description: res.error });
          } else if (!res.success) {
            toast.error('Execution failed: ' + res.error);
          } else {
            toast.success('Simulated execution complete', { description: 'Customer ETAs updated for 6 orders' });
          }
        }}
        onStale={(reason) => {
          markStale(reason);
          setDialog(null);
          toast.error('Plan marked stale', { description: 'Sent back to Supply Chain Manager for re-approval' });
        }} />
      
    </>);

}