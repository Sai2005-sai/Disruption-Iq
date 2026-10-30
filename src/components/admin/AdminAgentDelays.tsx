import React, { useState } from 'react';
import {
  AlertTriangleIcon,
  BotIcon,
  SendIcon,
  CheckCircle2Icon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  SearchIcon,
  SparklesIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  PackageIcon,
  ShieldAlertIcon,
  FileTextIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusChip, Tone } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Field, inputClass } from '../ui/Field';
import { AgentTicket, AiTicketSolution } from '../../types/domain';
import { cn } from '../../utils/cn';

export function AdminAgentDelays() {
  const { agentTickets, solveAgentDelayWithAi, forwardAgentTicketSolution, user } = useApp();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // AI Solution Modal State
  const [selectedTicket, setSelectedTicket] = useState<AgentTicket | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [aiSolution, setAiSolution] = useState<AiTicketSolution | null>(null);

  // Editable fields for Admin before forwarding
  const [editableDirective, setEditableDirective] = useState('');
  const [editableEta, setEditableEta] = useState('');
  const [editableCustomerMsg, setEditableCustomerMsg] = useState('');

  const filteredTickets = agentTickets.filter((t) => {
    if (!t) return false;
    const q = search.trim().toLowerCase();
    const id = (t.id || '').toLowerCase();
    const orderId = (t.orderId || '').toLowerCase();
    const customer = (t.customerName || '').toLowerCase();
    const agent = (t.agentName || '').toLowerCase();
    const area = (t.area || '').toLowerCase();
    const reason = (t.reason || '').toLowerCase();
    const notes = (t.notes || '').toLowerCase();

    const matchesSearch =
      !q ||
      id.includes(q) ||
      orderId.includes(q) ||
      customer.includes(q) ||
      agent.includes(q) ||
      area.includes(q) ||
      reason.includes(q) ||
      notes.includes(q);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && t.solutionStatus !== 'Forwarded to Agent') ||
      (filterStatus === 'forwarded' && t.solutionStatus === 'Forwarded to Agent');

    return matchesSearch && matchesStatus;
  });

  const pendingCount = agentTickets.filter((t) => t && t.solutionStatus !== 'Forwarded to Agent').length;
  const forwardedCount = agentTickets.filter((t) => t && t.solutionStatus === 'Forwarded to Agent').length;
  const totalDelayMinutes = agentTickets.reduce((acc, t) => acc + (t?.delayMinutes || 0), 0);
  const avgDelay = agentTickets.length > 0 ? Math.round(totalDelayMinutes / agentTickets.length) : 0;

  const handleOpenAiModal = async (ticket: AgentTicket) => {
    setSelectedTicket(ticket);
    setIsGeneratingAi(true);
    setAiSolution(null);

    try {
      const solution = await solveAgentDelayWithAi(ticket.id, ticket.orderId);
      setAiSolution(solution);
      setEditableDirective(solution.driverDirective);
      setEditableEta(solution.revisedEta);
      setEditableCustomerMsg(solution.customerExplanation);
    } catch (err: any) {
      toast.error('AI solution generation failed', {
        description: err.message || 'Please check your connection and try again.'
      });
      // Fallback draft so admin is never blocked
      const fallbackEta = `Today, +${ticket.delayMinutes || 45} mins`;
      setEditableDirective(
        `Contact customer dispatch immediately. Take alternative arterial bypass route to bypass congestion around ${ticket.area || 'delivery zone'}. Ensure customer receiving team is informed.`
      );
      setEditableEta(fallbackEta);
      setEditableCustomerMsg(
        `Your delivery of order ${ticket.orderId} has been rescheduled to ${fallbackEta} due to ${ticket.reason}. Priority driver rerouting is underway.`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleForwardSolution = async () => {
    if (!selectedTicket) return;
    if (!editableDirective.trim() || !editableEta.trim()) {
      toast.error('Please provide both driver instructions and a revised ETA');
      return;
    }

    setIsForwarding(true);
    try {
      await forwardAgentTicketSolution(selectedTicket.id, {
        solution: editableDirective.trim(),
        revisedEta: editableEta.trim(),
        customerExplanation: editableCustomerMsg.trim()
      });

      toast.success(`Solution forwarded for ${selectedTicket.id}`, {
        description: `Driver ${selectedTicket.agentName || 'Agent'} and Customer (${selectedTicket.customerName || selectedTicket.orderId}) notified with revised ETA.`
      });

      setSelectedTicket(null);
      setAiSolution(null);
    } catch (err: any) {
      toast.error('Failed to forward solution', { description: err.message });
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Driver Delay Reports</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">{agentTickets.length}</span>
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-ink">Field Tickets</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Awaiting Admin AI Solution</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-risk-high-ink">{pendingCount}</span>
            <span className="rounded-md bg-risk-high/10 px-2 py-0.5 text-xs font-semibold text-risk-high-ink">Action Needed</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Resolved &amp; Forwarded</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-risk-low-ink">{forwardedCount}</span>
            <span className="rounded-md bg-risk-low/10 px-2 py-0.5 text-xs font-semibold text-risk-low-ink">Synchronized</span>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Average Delay Reported</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">+{avgDelay} min</span>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">On Road</span>
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-ink">Driver Reported Delays &amp; Dynamic AI Resolution</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                <SparklesIcon className="h-3 w-3" /> Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Live delay tickets escalated by delivery agents on the road. Analyze incidents with Gemini AI, approve contingency directives, and dispatch revised ETAs directly to the customer portal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative max-w-xs w-full">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, driver, order..."
                className={`${inputClass} h-9 pl-9 text-xs`}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`${inputClass} h-9 w-auto text-xs`}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending AI Review ({pendingCount})</option>
              <option value="forwarded">Forwarded to Agent ({forwardedCount})</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center">
            <AlertTriangleIcon className="mx-auto h-8 w-8 text-muted mb-2" />
            <p className="text-sm font-medium text-ink">No driver delay tickets found</p>
            <p className="text-xs text-muted mt-1">
              When delivery agents report delays on their mobile portal, tickets appear here immediately.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((t) => {
              const isForwarded = t.solutionStatus === 'Forwarded to Agent';

              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all duration-150',
                    isForwarded ? 'border-line bg-surface' : 'border-amber-500/30 bg-amber-500/5'
                  )}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink">{t.id}</span>
                        <span className="rounded bg-navy/5 px-2 py-0.5 text-xs font-semibold text-ink">
                          Order: {t.orderId}
                        </span>
                        <span className="text-xs text-muted font-medium">· Customer: {t.customerName || 'Sundaram Motors'}</span>
                        <StatusChip tone={isForwarded ? 'success' : 'warning'}>
                          {t.solutionStatus || 'Pending Review'}
                        </StatusChip>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
                        <span className="flex items-center gap-1 text-ink-2">
                          <UserIcon className="h-3.5 w-3.5 text-muted" /> Driver: <strong>{t.agentName || 'Ravi Kumar'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-3.5 w-3.5 text-muted" /> {t.area || 'Ambattur Industrial Estate, Chennai'}
                        </span>
                        <span className="flex items-center gap-1 text-risk-critical-ink font-medium">
                          <ClockIcon className="h-3.5 w-3.5" /> Delay: +{t.delayMinutes || 45} mins
                        </span>
                        <span className="text-muted">Reported: {t.time || t.submitted || 'Recent'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto">
                      <Button
                        variant={isForwarded ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleOpenAiModal(t)}
                        icon={<SparklesIcon className="h-3.5 w-3.5 text-amber-400" />}
                      >
                        {isForwarded ? 'Review / Regenerate AI' : 'Solve with Gemini AI'}
                      </Button>
                    </div>
                  </div>

                  {/* Delay Reason & Notes from Driver */}
                  <div className="mt-3 rounded-lg bg-surface-2 p-3 text-xs">
                    <p className="font-semibold text-ink">
                      Reported Issue: <span className="font-normal text-ink-2">{t.reason}</span>
                    </p>
                    {t.notes && (
                      <p className="mt-1 text-muted">
                        Driver Notes: <span className="italic text-ink-2">"{t.notes}"</span>
                      </p>
                    )}
                  </div>

                  {/* Forwarded Solution Banner */}
                  {isForwarded && t.adminSolution && (
                    <div className="mt-3 rounded-lg border border-risk-low/30 bg-risk-low/10 p-3 text-xs">
                      <div className="flex items-center justify-between font-semibold text-risk-low-ink pb-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2Icon className="h-3.5 w-3.5" /> Dispatched AI Directive (by {t.forwardedBy || 'Admin'})
                        </span>
                        {t.revisedEta && <span className="bg-risk-low/20 px-2 py-0.5 rounded text-[11px]">Revised Customer ETA: {t.revisedEta}</span>}
                      </div>
                      <p className="text-ink mt-1 whitespace-pre-line leading-relaxed">{t.adminSolution}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Gemini AI Resolution Modal */}
      {selectedTicket && (
        <Modal
          open={!!selectedTicket}
          onClose={() => {
            if (!isGeneratingAi && !isForwarding) {
              setSelectedTicket(null);
              setAiSolution(null);
            }
          }}
          title={`Gemini AI Resolution: ${selectedTicket.id} (${selectedTicket.orderId})`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-navy/5 p-3 text-xs text-ink space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Incident Details:</span>
                <span className="text-risk-critical-ink font-semibold">+{selectedTicket.delayMinutes || 45} min delay</span>
              </div>
              <p>
                <strong>Driver:</strong> {selectedTicket.agentName || 'Agent'} · <strong>Customer:</strong> {selectedTicket.customerName}
              </p>
              <p>
                <strong>Reason:</strong> {selectedTicket.reason}
              </p>
              {selectedTicket.notes && (
                <p>
                  <strong>Notes:</strong> {selectedTicket.notes}
                </p>
              )}
            </div>

            {isGeneratingAi ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <RefreshCwIcon className="h-7 w-7 text-accent animate-spin" />
                <p className="text-sm font-semibold text-ink">Querying Gemini 3.8 Flash...</p>
                <p className="text-xs text-muted text-center max-w-sm">
                  Synthesizing real-time traffic conditions, customer SLA constraints, and actionable driver bypass directives.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
                    <SparklesIcon className="h-4 w-4" />
                    <span>Dynamic Gemini 3.8 Logistics Plan</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenAiModal(selectedTicket)}
                    icon={<RefreshCwIcon className="h-3 w-3" />}
                  >
                    Regenerate
                  </Button>
                </div>

                {/* Structured AI sections if available */}
                {aiSolution && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-line bg-surface-2 p-2.5">
                      <span className="font-semibold text-ink block mb-1">📋 Action Plan:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-ink-2">
                        {aiSolution.actionPlan?.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-line bg-surface-2 p-2.5">
                      <span className="font-semibold text-ink block mb-1">🛡️ Risk Mitigation:</span>
                      <p className="text-ink-2 leading-relaxed">{aiSolution.riskMitigation}</p>
                    </div>
                  </div>
                )}

                {/* Editable Driver Directive */}
                <Field
                  label="Driver Recovery Directive (Sent to Delivery Agent Portal)"
                  htmlFor="driver-directive"
                  hint="Instructions for driver on route, dock reroute, or vehicle assist"
                  required
                >
                  <textarea
                    id="driver-directive"
                    rows={4}
                    value={editableDirective}
                    onChange={(e) => setEditableDirective(e.target.value)}
                    className={`${inputClass} text-xs font-mono`}
                    placeholder="Enter instructions for the delivery agent..."
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Editable Revised ETA */}
                  <Field
                    label="Revised Customer Delivery ETA"
                    htmlFor="revised-eta"
                    hint="Will be updated live on Customer Tracking"
                    required
                  >
                    <input
                      id="revised-eta"
                      type="text"
                      value={editableEta}
                      onChange={(e) => setEditableEta(e.target.value)}
                      className={`${inputClass} text-xs`}
                      placeholder="e.g. Today, 29 Oct · 16:30 IST"
                    />
                  </Field>

                  {/* Customer Notice Explanation */}
                  <Field
                    label="Customer Explanation Message"
                    htmlFor="customer-explanation"
                    hint="Customer will see this under 'Why is my order late?'"
                    required
                  >
                    <input
                      id="customer-explanation"
                      type="text"
                      value={editableCustomerMsg}
                      onChange={(e) => setEditableCustomerMsg(e.target.value)}
                      className={`${inputClass} text-xs`}
                      placeholder="Explanation for customer..."
                    />
                  </Field>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 border-t border-line pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedTicket(null);
                      setAiSolution(null);
                    }}
                    disabled={isForwarding}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleForwardSolution}
                    disabled={isForwarding || !editableDirective.trim() || !editableEta.trim()}
                    icon={<SendIcon className="h-4 w-4" />}
                  >
                    {isForwarding ? 'Forwarding & Updating Customer...' : 'Forward to Agent & Update Customer'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
