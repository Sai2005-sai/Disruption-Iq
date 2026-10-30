import React, { useState } from 'react';
import { SendIcon, RotateCcwIcon, AlertTriangleIcon, ClockIcon, CheckCircle2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { webhookCarriers } from '../../data/dataConsole';
import { useApp } from '../../contexts/AppContext';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';

export interface LogEvent {
  id: string;
  time: string;
  kind: 'accepted' | 'duplicate' | 'invalid' | 'conflict' | 'scenario';
  title: string;
  detail: string;
}

interface Props {
  onEvent: (e: Omit<LogEvent, 'id' | 'time'>) => void;
}

const statuses = ['DELAYED', 'IN_TRANSIT', 'EXCEPTION', 'DELIVERED'];
const reasons = ['Weather', 'Hub congestion at Hosur', 'Customs hold', 'Vehicle breakdown', 'Linehaul delay'];

export function WebhookPanel({ onEvent }: Props) {
  const { reloadStateFromBackend } = useApp();
  const [carrier, setCarrier] = useState('Delhivery');
  const [trackingNo, setTrackingNo] = useState('DL123456');
  const [status, setStatus] = useState('DELAYED');
  const [reason, setReason] = useState('Weather');
  const [eventId, setEventId] = useState('evt_1001');
  const [newEta, setNewEta] = useState('2026-11-03T18:00:00Z');
  const [timestamp, setTimestamp] = useState('2026-10-30T09:00:00Z');
  const [lastSentEventId, setLastSentEventId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const payload = {
    event_id: eventId,
    carrier,
    tracking_no: trackingNo,
    status,
    reason,
    new_eta: newEta,
    timestamp
  };

  const postWebhook = async (bodyPayload: Record<string, any>, mode: 'normal' | 'duplicate' | 'invalid' | 'stale') => {
    setSending(true);
    try {
      const res = await fetch('/webhooks/carrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      await reloadStateFromBackend();

      if (res.status === 202) {
        onEvent({
          kind: 'accepted',
          title: `202 Accepted · ${bodyPayload.status} (${bodyPayload.event_id})`,
          detail: `${bodyPayload.carrier} ${bodyPayload.tracking_no} · New ETA ${bodyPayload.new_eta || 'N/A'} · Timestamp ${bodyPayload.timestamp}`
        });
        setLastSentEventId(bodyPayload.event_id);
        toast.success(`Webhook ${bodyPayload.event_id} accepted (202)`, {
          description: `${bodyPayload.carrier} ${bodyPayload.tracking_no} updated in SQLite & linked orders re-scored.`
        });
        if (mode === 'normal') {
          const nextNum = parseInt(bodyPayload.event_id.replace(/\D/g, '') || '1001', 10) + 1;
          setEventId(`evt_${nextNum}`);
        }
      } else if (res.status === 200 && data.status === 'duplicate_ignored') {
        onEvent({
          kind: 'duplicate',
          title: `200 Duplicate Ignored · ${bodyPayload.event_id}`,
          detail: data.message || `Same event_id "${bodyPayload.event_id}" sent twice — idempotency guard ignored duplicate`
        });
        toast.warning(`Duplicate event_id "${bodyPayload.event_id}" ignored`, {
          description: 'Idempotency check prevented double-processing.'
        });
      } else if (res.status === 400) {
        onEvent({
          kind: 'invalid',
          title: `400 Rejected (Invalid Data) · ${bodyPayload.event_id || 'Missing ID'}`,
          detail: data.error || 'Missing required fields or negative quantity rejected & logged in audit trail'
        });
        toast.error('Invalid webhook rejected (400)', {
          description: data.error
        });
      } else if (res.status === 409) {
        onEvent({
          kind: 'conflict',
          title: `409 Conflict (Older Timestamp) · ${bodyPayload.event_id}`,
          detail: data.error || 'Older timestamp event arrived after newer state — prevented overwrite'
        });
        toast.error('Conflicting older timestamp ignored (409)', {
          description: data.error
        });
      }
    } catch (err: any) {
      toast.error('Webhook request failed: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const sendValid = () => {
    postWebhook(payload, 'normal');
  };

  const replayDuplicate = () => {
    const dupId = lastSentEventId || eventId;
    postWebhook({ ...payload, event_id: dupId }, 'duplicate');
  };

  const sendInvalidPayload = () => {
    postWebhook(
      {
        event_id: `evt_bad_${Math.floor(100 + Math.random() * 899)}`,
        carrier,
        tracking_no: '', // Deliberately missing tracking_no
        status: 'DELAYED',
        quantity: -15, // Deliberately negative quantity
        timestamp: new Date().toISOString()
      },
      'invalid'
    );
  };

  const sendStaleTimestamp = () => {
    postWebhook(
      {
        ...payload,
        event_id: `evt_stale_${Math.floor(100 + Math.random() * 899)}`,
        status: 'IN_TRANSIT',
        reason: 'Out-of-order packet from earlier hub scan',
        timestamp: '2026-10-28T04:15:00Z' // Older than 2026-10-30T09:00:00Z
      },
      'stale'
    );
  };

  return (
    <Card as="section">
      <CardHeader
        title="Simulated carrier webhook"
        description="POST /webhooks/carrier · Live HTTP endpoint with idempotency, validation & timestamp ordering"
      />
      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Event ID (Idempotency)" htmlFor="wh-evtid">
            <input id="wh-evtid" value={eventId} onChange={(e) => setEventId(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Carrier" htmlFor="wh-carrier">
            <select id="wh-carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} className={inputClass}>
              {webhookCarriers.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Tracking No" htmlFor="wh-awb">
            <input id="wh-awb" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Status" htmlFor="wh-status">
            <select id="wh-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Reason" htmlFor="wh-reason">
            <select id="wh-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
              {reasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Event Timestamp (ISO)" htmlFor="wh-ts">
            <input id="wh-ts" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">HTTP POST JSON Payload (`POST /webhooks/carrier`)</p>
          <pre className="max-h-48 overflow-auto rounded-lg bg-navy p-3 font-mono text-[12px] leading-relaxed text-slate-100">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button icon={<SendIcon className="h-4 w-4" />} loading={sending} onClick={sendValid}>
            Fire carrier webhook
          </Button>
          <Button
            variant="secondary"
            icon={<RotateCcwIcon className="h-4 w-4" />}
            disabled={sending}
            onClick={replayDuplicate}
            title="Sends the exact same event_id twice to demonstrate idempotency protection"
          >
            Replay duplicate ({lastSentEventId || eventId})
          </Button>
          <Button
            variant="secondary"
            icon={<AlertTriangleIcon className="h-4 w-4 text-risk-critical-ink" />}
            disabled={sending}
            onClick={sendInvalidPayload}
            title="Sends missing tracking_no and negative quantity (-15) to test 400 validation"
          >
            Test invalid payload (-qty)
          </Button>
          <Button
            variant="secondary"
            icon={<ClockIcon className="h-4 w-4 text-risk-high-ink" />}
            disabled={sending}
            onClick={sendStaleTimestamp}
            title="Sends an older timestamp (2026-10-28) after a newer one (2026-10-30) to test out-of-order protection"
          >
            Test older timestamp conflict
          </Button>
        </div>
      </div>
    </Card>
  );
}