import React, { useState } from 'react';
import { ArrowLeftIcon, CheckIcon, XIcon, InboxIcon, PackageIcon, TruckIcon, MessageSquareIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { parentRequests } from '../../data/parentRequests';
import { ParentRequest, StockAvailability, Complaint } from '../../types/domain';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RiskBadge, StatusChip, Tone } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Field, inputClass } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { Segmented, Tabs } from '../../components/ui/Tabs';
import { cn } from '../../utils/cn';

const availTone: Record<StockAvailability, Tone> = { Available: 'success', 'Partially Available': 'warning', Unavailable: 'danger' };
const statusTone: Record<ParentRequest['status'], Tone> = { Pending: 'info', Approved: 'success', Rejected: 'danger' };
const complaintTone: Record<Complaint['status'], Tone> = { Submitted: 'info', 'In review': 'warning', Resolved: 'success' };
type Box = 'Pending' | 'All';

export function ParentRequests() {
  const { workflow, decideStep, logAudit, complaints } = useApp();
  const [parentTab, setParentTab] = useState<'requests' | 'complaints'>('requests');
  const [requests, setRequests] = useState<ParentRequest[]>(parentRequests);
  const [selectedId, setSelectedId] = useState<string | null>('REQ-551');
  const [mobileDetail, setMobileDetail] = useState(false);
  const [box, setBox] = useState<Box>('Pending');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [confirmReject, setConfirmReject] = useState(false);
  const [complaintSearch, setComplaintSearch] = useState('');

  const list = requests.filter((r) => box === 'All' || r.status === 'Pending');
  const selected = requests.find((r) => r.id === selectedId) ?? null;

  const decide = (status: 'Approved' | 'Rejected') => {
    if (!selected) return;
    if (status === 'Rejected' && comment.trim().length < 8) {
      setError('A rejection needs a comment of at least 8 characters.');
      return;
    }
    setRequests((rs) => rs.map((r) => r.id === selected.id ? { ...r, status } : r));
    logAudit({ action: status === 'Approved' ? 'Approval' : 'Rejection', target: selected.id, reason: comment.trim() || 'No comment', before: 'Pending', after: status });
    const parentStep = workflow.steps.find((s) => s.status === 'current' && s.role === 'parent_company');
    if (selected.linkedCase === workflow.planId && parentStep && selected.type === 'Transfer approval') {
      decideStep(status === 'Approved' ? 'approve' : 'reject', comment.trim() || `${status} via ${selected.id}`);
    }
    toast[status === 'Approved' ? 'success' : 'error'](`${selected.id} ${status.toLowerCase()}`, { description: `SwiftLane notified · linked case ${selected.linkedCase}` });
    setComment('');
    setError('');
    setConfirmReject(false);
  };

  const filteredComplaints = complaints.filter(
    (c) =>
      c.id.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.orderId.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(complaintSearch.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Partner requests &amp; escalations"
        description="Stock confirmations, transfer approvals, and customer complaints forwarded from SwiftLane Logistics."
        meta={<StatusChip tone="info">{requests.filter((r) => r.status === 'Pending').length} pending requests</StatusChip>}
      />

      <Tabs
        className="mb-6"
        value={parentTab}
        onChange={(id) => setParentTab(id as 'requests' | 'complaints')}
        tabs={[
          {
            id: 'requests',
            label: 'Stock & Transfer Requests',
            count: requests.filter((r) => r.status === 'Pending').length
          },
          {
            id: 'complaints',
            label: 'Customer Complaints & Escalations',
            count: complaints.length
          }
        ]}
      />

      {parentTab === 'requests' && (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <Card className={cn('self-start', mobileDetail && 'hidden lg:block')}>
            <div className="flex items-center justify-between border-b border-line p-4">
              <h2 className="text-[15px] font-semibold text-ink">Inbox</h2>
              <Segmented<Box>
                label="Inbox filter"
                value={box}
                onChange={setBox}
                options={[
                  { id: 'Pending', label: 'Pending' },
                  { id: 'All', label: 'All' }
                ]}
              />
            </div>
            {list.length === 0 ? (
              <EmptyState icon={InboxIcon} title="Inbox zero" body="No pending requests from your delivery partner." />
            ) : (
              <ul className="divide-y divide-line">
                {list.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => {
                        setSelectedId(r.id);
                        setMobileDetail(true);
                        setComment('');
                        setError('');
                      }}
                      className={cn(
                        'w-full px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-2',
                        r.id === selectedId && 'bg-accent/5'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-muted">
                        <span>
                          {r.id} · {r.type}
                        </span>
                        <StatusChip tone={statusTone[r.status]}>{r.status}</StatusChip>
                      </div>
                      <p className="mt-1 font-medium text-ink text-sm leading-snug">{r.title}</p>
                      <p className="mt-1 text-xs text-muted truncate">{r.note}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                        <span>{r.shipment.destination}</span>
                        <span className="tabular-nums">{r.received}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className={cn('min-w-0', !mobileDetail && 'hidden lg:block')}>
            {selected ? (
              <Card className="p-5 lg:p-6">
                <button
                  onClick={() => setMobileDetail(false)}
                  className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink lg:hidden"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to inbox
                </button>

                <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-mono font-medium text-ink">{selected.id}</span>
                      <span>·</span>
                      <span>{selected.type}</span>
                      <span>·</span>
                      <span>Linked {selected.linkedCase}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-bold text-ink">{selected.title}</h2>
                    <p className="mt-1 text-sm text-ink-2 leading-relaxed">{selected.note}</p>
                  </div>
                  <StatusChip tone={statusTone[selected.status]}>{selected.status}</StatusChip>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-line bg-surface-2/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Source Facility</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{selected.shipment.origin} ({selected.products[0]?.location || 'Facility'})</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted">Stock Status:</span>
                      <StatusChip tone={availTone[selected.products[0]?.availability || 'Available']}>
                        {selected.products[0]?.availability || 'Available'}
                      </StatusChip>
                    </div>
                  </div>

                  <div className="rounded-xl border border-line bg-surface-2/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Destination Hub</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{selected.shipment.destination}</p>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-muted">Quantity Requested:</span>
                      <span className="font-bold tabular-nums text-ink">
                        {selected.products.reduce((sum, p) => sum + p.requested, 0)} units
                      </span>
                    </div>
                  </div>
                </div>

                {selected.status === 'Pending' && (
                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
                    <Button icon={<CheckIcon className="h-4 w-4" />} onClick={() => decide('Approved')}>
                      Authorize transfer
                    </Button>
                    <Button variant="danger" icon={<XIcon className="h-4 w-4" />} onClick={() => setConfirmReject(true)}>
                      Reject request
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card>
                <EmptyState icon={InboxIcon} title="Select a request" body="Pick a request from the inbox to inspect order, shipment and stock details." />
              </Card>
            )}
          </div>
        </div>
      )}

      {parentTab === 'complaints' && (
        <Card className="p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
            <div>
              <h2 className="text-base font-bold text-ink">Customer Escalations &amp; Complaints</h2>
              <p className="text-xs text-muted">
                Direct issues filed by end customers (e.g. Sundaram Motors). Review these complaints to assess SLA risks and approve stock releases.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={complaintSearch}
                onChange={(e) => setComplaintSearch(e.target.value)}
                placeholder="Search complaints..."
                className={`${inputClass} pl-9 text-xs`}
              />
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <EmptyState
              icon={MessageSquareIcon}
              title="No customer complaints"
              body="No complaints match your query. Any customer tickets submitted in the Customer Portal appear here."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line bg-surface-2/60 text-xs text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Complaint ID</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Category / Reason</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2/50 transition">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-ink">
                        {c.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-2">
                        {c.orderId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-ink">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink leading-relaxed max-w-xs truncate" title={c.description}>
                        {c.description}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                        {c.submitted}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusChip tone={complaintTone[c.status]}>{c.status}</StatusChip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal
        open={confirmReject}
        onClose={() => setConfirmReject(false)}
        title={`Reject ${selected?.id ?? ''}?`}
        description="SwiftLane will need to choose another recovery path."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReject(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => decide('Rejected')}>
              Reject request
            </Button>
          </>
        }
      >
        <Field label="Reason" htmlFor="reject-comment" required error={error}>
          <textarea
            id="reject-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className={inputClass}
            placeholder="Why can’t this be approved?"
          />
        </Field>
      </Modal>
    </>
  );
}