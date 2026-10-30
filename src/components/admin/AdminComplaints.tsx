import React, { useState } from 'react';
import { SearchIcon, MessageSquareIcon, FilterIcon, ReplyIcon, CheckCircle2Icon, ChevronDownIcon, ChevronUpIcon, SendIcon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusChip, Tone } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from '../ui/Modal';
import { Field, inputClass } from '../ui/Field';
import { Complaint } from '../../types/domain';
import { cn } from '../../utils/cn';

const complaintTone: Record<Complaint['status'], Tone> = {
  Submitted: 'info',
  'In review': 'warning',
  Resolved: 'success'
};

const CANNED_REPLIES = [
  'We have verified the shipment delay and allocated replacement stock from Bengaluru warehouse.',
  'Priority driver dispatch has been re-assigned for immediate expedited delivery.',
  'The batch discrepancy has been reported to the warehouse dispatch team for immediate resolution.',
  'Address update relayed to the local courier lead; delivery rescheduled within the priority window.'
];

export function AdminComplaints() {
  const { complaints, replyToComplaint, user } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Reply modal state
  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'Submitted' | 'In review' | 'Resolved'>('In review');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.orderId.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.adminReply && c.adminReply.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || c.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleOpenReply = (c: Complaint) => {
    setActiveComplaint(c);
    setReplyText(c.adminReply || '');
    setReplyStatus(c.status === 'Submitted' ? 'In review' : c.status);
    setReplyError('');
  };

  const handleSendReply = async () => {
    if (!activeComplaint) return;
    if (!replyText.trim() || replyText.trim().length < 5) {
      setReplyError('Please enter a response of at least 5 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await replyToComplaint(activeComplaint.id, replyText.trim(), replyStatus);
      toast.success(`Reply sent for ${activeComplaint.id}`, {
        description: `Customer will receive this update in their Customer Portal Notifications.`
      });
      setActiveComplaint(null);
      setReplyText('');
    } catch (err: any) {
      toast.error('Failed to send reply: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card as="section" className="p-5">
      {/* Header section matching parent portal style */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <h2 className="text-base font-bold text-ink">Customer Complaints &amp; Escalations</h2>
          <p className="text-xs text-muted">
            Direct issues filed by end customers (e.g. Sundaram Motors). Review complaints, check SLA risk, and respond directly to customer notifications.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative max-w-xs w-full">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search complaints..."
              className={`${inputClass} pl-9 text-xs`}
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <FilterIcon className="h-3.5 w-3.5 text-muted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`${inputClass} py-1 text-xs w-auto`}
            >
              <option value="all">All ({complaints.length})</option>
              <option value="submitted">Submitted</option>
              <option value="in review">In review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table matching parent portal with Action/Reply column */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquareIcon}
          title="No customer complaints"
          body={search ? 'No complaints match your search query.' : 'Any complaints submitted via the Customer Portal will appear here.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-surface-2/60 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Complaint ID</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Category / Reason</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Admin Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => {
                const isExpanded = expandedId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr className="hover:bg-surface-2/50 transition">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-ink">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          className="inline-flex items-center gap-1 text-accent-ink hover:underline"
                        >
                          {c.id}
                          {isExpanded ? (
                            <ChevronUpIcon className="h-3.5 w-3.5 text-muted" />
                          ) : (
                            <ChevronDownIcon className="h-3.5 w-3.5 text-muted" />
                          )}
                        </button>
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
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {c.adminReply ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2Icon className="h-3 w-3" /> Replied
                            </span>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleOpenReply(c)}
                              className="text-xs py-1 px-2.5 h-auto"
                            >
                              Edit
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<ReplyIcon className="h-3.5 w-3.5" />}
                            onClick={() => handleOpenReply(c)}
                            className="text-xs py-1 px-2.5 h-auto"
                          >
                            Reply
                          </Button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable row showing full description and admin reply */}
                    {isExpanded && (
                      <tr className="bg-surface-2/30">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3 text-xs">
                            <div className="rounded-md border border-line bg-surface p-3">
                              <p className="font-semibold text-muted uppercase tracking-wider text-[10px]">
                                Customer Complaint Details · {c.orderId}
                              </p>
                              <p className="mt-1 text-sm text-ink leading-relaxed whitespace-pre-wrap">{c.description}</p>
                              <p className="mt-1 text-[11px] text-muted">Submitted on: {c.submitted}</p>
                            </div>

                            {c.adminReply ? (
                              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
                                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                                  <span className="flex items-center gap-1.5">
                                    <ReplyIcon className="h-3.5 w-3.5" />
                                    Admin Response (Notified to Customer)
                                  </span>
                                  {c.repliedAt && <span className="text-[11px] font-normal text-muted">{c.repliedAt}</span>}
                                </div>
                                <p className="mt-1 text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{c.adminReply}</p>
                                {c.repliedBy && (
                                  <p className="mt-1 text-[11px] text-muted">
                                    Operator: <span className="font-medium text-ink">{c.repliedBy}</span>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between rounded-md border border-dashed border-line p-3 bg-surface">
                                <span className="text-muted">No response sent yet to customer.</span>
                                <Button size="sm" onClick={() => handleOpenReply(c)} icon={<ReplyIcon className="h-3.5 w-3.5" />}>
                                  Reply now
                                </Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reply Modal */}
      {activeComplaint && (
        <Modal
          open={Boolean(activeComplaint)}
          onClose={() => setActiveComplaint(null)}
          title={`Reply to Complaint ${activeComplaint.id}`}
          description={`Customer Order ${activeComplaint.orderId} · ${activeComplaint.category}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setActiveComplaint(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendReply}
                loading={isSubmitting}
                icon={<SendIcon className="h-4 w-4" />}
              >
                Send Reply &amp; Notify Customer
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Customer Complaint Overview */}
            <div className="rounded-lg border border-line bg-surface-2/50 p-3.5">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>Customer description ({activeComplaint.submitted})</span>
                <StatusChip tone={complaintTone[activeComplaint.status]}>{activeComplaint.status}</StatusChip>
              </div>
              <p className="text-xs text-ink leading-relaxed font-normal">{activeComplaint.description}</p>
            </div>

            {/* Quick Canned Response suggestions */}
            <div>
              <p className="text-xs font-medium text-muted mb-1.5">Quick response templates:</p>
              <div className="flex flex-wrap gap-1.5">
                {CANNED_REPLIES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyText(tmpl)}
                    className="rounded border border-line bg-surface hover:bg-accent/5 hover:border-accent/30 text-left px-2 py-1 text-[11px] text-muted hover:text-ink transition"
                  >
                    + {tmpl.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Input */}
            <Field label="Official Admin Reply (Visible in Customer Portal Notifications)" htmlFor="reply-body" required error={replyError}>
              <textarea
                id="reply-body"
                rows={4}
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  if (replyError) setReplyError('');
                }}
                className={inputClass}
                placeholder="Type your response to the customer. This will be posted to their notifications..."
                autoFocus
              />
            </Field>

            {/* Update Status */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Update Ticket Status" htmlFor="reply-status">
                <select
                  id="reply-status"
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="In review">In review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Submitted">Submitted (Keep pending)</option>
                </select>
              </Field>

              <div className="rounded-lg border border-line bg-surface-2/30 p-2.5 text-xs text-muted flex items-center gap-2">
                <UserIcon className="h-4 w-4 shrink-0 text-accent" />
                <div>
                  <p className="font-medium text-ink">{user.name}</p>
                  <p className="text-[10px] text-muted">Delivery Partner Admin</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
