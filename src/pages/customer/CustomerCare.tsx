import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaperclipIcon, XIcon, MessageSquareIcon, AlertCircleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { customerNotices, complaintCategories, customerOrders } from '../../data/customer';
import { Complaint, CustomerNotice } from '../../types/domain';
import { useApp } from '../../contexts/AppContext';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip, Tone } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Field, inputClass } from '../../components/ui/Field';
import { EmptyState } from '../../components/ui/EmptyState';
import { CareChat } from '../../components/customer/CareChat';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../utils/cn';

const noticeTone: Record<CustomerNotice['kind'], Tone> = {
  'Delay notice': 'warning',
  'ETA change': 'info',
  Resolution: 'success',
  Update: 'neutral'
};
const complaintTone: Record<Complaint['status'], Tone> = {
  Submitted: 'info',
  'In review': 'warning',
  Resolved: 'success'
};
const steps: Complaint['status'][] = ['Submitted', 'In review', 'Resolved'];

export function CustomerCare() {
  const [params, setParams] = useSearchParams();
  const { complaints, submitComplaint, customerNotices, markCustomerNoticeRead, markAllCustomerNoticesRead } = useApp();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const tabParam = params.get('tab') ?? 'notifications';
  const tab = isDesktop && tabParam === 'chat' ? 'notifications' : tabParam;

  const [orderId, setOrderId] = useState('ORD-10482');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ category?: string; customCategory?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const tabs = [
    { id: 'notifications', label: 'Notifications', count: customerNotices.filter((n) => n.unread).length },
    { id: 'complaints', label: 'Complaints', count: complaints.filter((c) => c.status !== 'Resolved').length },
    ...(isDesktop ? [] : [{ id: 'chat', label: 'Chat' }])
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};

    if (!category) {
      next.category = 'Choose a category.';
    }
    if (category === 'Other' && !customCategory.trim()) {
      next.customCategory = 'Please specify your complaint reason.';
    }
    if (description.trim().length < 15) {
      next.description = 'Tell us a bit more (at least 15 characters).';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const finalCategory = category === 'Other' ? `Other: ${customCategory.trim()}` : category;
      const created = await submitComplaint({
        orderId,
        category: finalCategory,
        description: description.trim()
      });

      toast.success(`Complaint ${created.id} submitted`, {
        description: 'Recorded in system. Visible to Parent Company and Admin portals.'
      });

      setCategory('');
      setCustomCategory('');
      setDescription('');
      setFile(null);
      setErrors({});
    } catch (err: any) {
      toast.error('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications & support"
        description="Updates about your orders, complaints you’ve raised, and live chat with our care team."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <Tabs tabs={tabs} value={tab} onChange={(id) => setParams({ tab: id })} className="mb-6" />

          {tab === 'notifications' && (
            <Card>
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="text-sm text-muted">{customerNotices.length} notifications</p>
                <button
                  onClick={() => markAllCustomerNoticesRead()}
                  className="text-[13px] font-medium text-accent-ink hover:underline"
                >
                  Mark all read
                </button>
              </div>
              {customerNotices.length === 0 ? (
                <EmptyState
                  icon={MessageSquareIcon}
                  title="No notifications"
                  body="You'll be alerted here whenever order ETAs change or Admin responds to your complaints."
                />
              ) : (
                <ul className="divide-y divide-line">
                  {customerNotices.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => {
                        if (n.unread) markCustomerNoticeRead(n.id);
                      }}
                      className={cn(
                        'flex gap-4 px-5 py-4 transition-colors duration-150 cursor-pointer',
                        n.unread ? 'bg-accent/[0.03] hover:bg-accent/[0.06]' : 'hover:bg-surface-2/40'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          n.unread ? 'bg-accent animate-pulse' : 'bg-transparent'
                        )}
                        aria-label={n.unread ? 'Unread' : undefined}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip tone={noticeTone[n.kind]}>{n.kind}</StatusChip>
                          <span className="text-xs text-muted">{n.time}</span>
                          {n.complaintId && (
                            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent-ink">
                              Ticket {n.complaintId}
                            </span>
                          )}
                        </div>
                        <p className={cn('mt-1.5 text-sm', n.unread ? 'font-semibold text-ink' : 'text-ink-2')}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-sm text-muted leading-relaxed whitespace-pre-wrap">{n.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {tab === 'complaints' && (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card as="section">
                <CardHeader
                  title="Raise a complaint"
                  description="Complaints are immediately forwarded to SwiftLane Admin and Kaveri Parent Company"
                />
                <form onSubmit={submit} className="space-y-4 p-5" noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Order" htmlFor="c-order">
                      <select
                        id="c-order"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className={inputClass}
                      >
                        {customerOrders.map((o) => (
                          <option key={o.id}>{o.id}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Category (10 Options + Other)" htmlFor="c-cat" required error={errors.category}>
                      <select
                        id="c-cat"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          if (e.target.value !== 'Other') setCustomCategory('');
                        }}
                        className={inputClass}
                      >
                        <option value="">Select a reason…</option>
                        {complaintCategories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Custom Reason / Category Input when 'Other' is chosen */}
                  {category === 'Other' && (
                    <Field
                      label="Specify your reason / category"
                      htmlFor="c-custom-category"
                      required
                      error={errors.customCategory}
                    >
                      <input
                        id="c-custom-category"
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Type your custom complaint reason here..."
                        className={inputClass}
                        autoFocus
                      />
                    </Field>
                  )}

                  <Field label="Description" htmlFor="c-desc" required error={errors.description}>
                    <textarea
                      id="c-desc"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={inputClass}
                      placeholder="Please provide specifics (batch numbers, damaged count, delivery discrepancies)..."
                    />
                  </Field>

                  <div>
                    {file ? (
                      <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-ink">
                          <PaperclipIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                          <span className="truncate">{file.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="rounded p-1 text-muted hover:text-ink"
                          aria-label="Remove attachment"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-accent-ink hover:underline">
                        <PaperclipIcon className="h-4 w-4" aria-hidden /> Attach photo or PDF
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    )}
                  </div>

                  <Button type="submit" className="w-full" loading={submitting}>
                    Submit complaint
                  </Button>
                </form>
              </Card>

              <Card as="section" className="self-start">
                <CardHeader title="Your complaints" description={`${complaints.length} tickets recorded in system`} />
                {complaints.length === 0 ? (
                  <EmptyState
                    icon={MessageSquareIcon}
                    title="No complaints"
                    body="Anything you raise will be tracked here and escalated to Operations."
                  />
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {complaints.map((c) => {
                      const idx = steps.indexOf(c.status);
                      return (
                        <li key={c.id} className="px-5 py-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-ink">
                              {c.id} · <span className="text-accent-ink">{c.category}</span>
                            </p>
                            <StatusChip tone={complaintTone[c.status]}>{c.status}</StatusChip>
                          </div>
                          <p className="mt-1 line-clamp-2 text-[13px] text-muted">{c.description}</p>
                          <div className="mt-3 flex items-center gap-1.5" aria-label={`Progress: ${c.status}`}>
                            {steps.map((s, i) => (
                              <span
                                key={s}
                                className={cn('h-1 flex-1 rounded-full', i <= idx ? 'bg-accent' : 'bg-line')}
                              />
                            ))}
                          </div>
                          <p className="mt-1.5 text-xs text-muted">
                            Order {c.orderId} · Submitted {c.submitted}
                          </p>

                          {c.adminReply && (
                            <div className="mt-3 rounded-lg border border-accent/25 bg-accent/5 p-3 text-xs">
                              <div className="flex items-center justify-between font-semibold text-accent-ink">
                                <span className="flex items-center gap-1.5">
                                  <MessageSquareIcon className="h-3.5 w-3.5" />
                                  Admin Response
                                </span>
                                {c.repliedAt && <span className="text-[11px] font-normal text-muted">{c.repliedAt}</span>}
                              </div>
                              <p className="mt-1 text-ink-2 leading-relaxed whitespace-pre-wrap">{c.adminReply}</p>
                              {c.repliedBy && (
                                <p className="mt-1 text-[10px] text-muted">
                                  Responded by: <span className="font-medium text-ink">{c.repliedBy}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab === 'chat' && !isDesktop && <CareChat className="h-[560px]" />}
        </div>

        {isDesktop && <CareChat className="h-[640px] lg:sticky lg:top-0" />}
      </div>
    </>
  );
}