import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PlayIcon, CheckIcon, WebhookIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { scenarios } from '../data/dataConsole';
import { clockTime } from '../utils/format';
import { useApp } from '../contexts/AppContext';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusChip, Tone } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { ImportPanel } from '../components/data/ImportPanel';
import { WebhookPanel, LogEvent } from '../components/data/WebhookPanel';

const kindTone: Record<LogEvent['kind'], Tone> = {
  accepted: 'success',
  duplicate: 'warning',
  invalid: 'danger',
  conflict: 'orange',
  scenario: 'info'
};
const kindLabel: Record<LogEvent['kind'], string> = {
  accepted: 'Accepted',
  duplicate: 'Duplicate',
  invalid: 'Rejected',
  conflict: 'Conflict',
  scenario: 'Scenario'
};

export function DataConsole() {
  const navigate = useNavigate();
  const { pushNotification, runScenario: triggerBackendScenario } = useApp();
  const [log, setLog] = useState<LogEvent[]>([
    {
      id: 'e0',
      time: '09:00:00',
      kind: 'accepted',
      title: '202 Accepted · DELAYED (evt_1001)',
      detail: 'Delhivery DL123456 · New ETA 2026-11-03T18:00:00Z · Reason: Weather'
    }
  ]);
  const [running, setRunning] = useState<{id: string;step: number;} | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const addEvent = (e: Omit<LogEvent, 'id' | 'time'>) => setLog((l) => [{ ...e, id: `e${Date.now()}${Math.random()}`, time: clockTime() }, ...l].slice(0, 40));

  const runScenario = (id: string) => {
    const s = scenarios.find((x) => x.id === id);
    if (!s || running) return;
    setRunning({ id, step: 0 });
    triggerBackendScenario(id);
    s.steps.forEach((step, i) => {
      timers.current.push(
        window.setTimeout(() => {
          addEvent({ kind: 'scenario', title: step, detail: s.name });
          setRunning({ id, step: i + 1 });
          if (i === s.steps.length - 1) {
            setRunning(null);
            pushNotification({ title: `${s.name.split(':')[0]} completed`, body: s.description, type: 'alert', to: s.to });
            toast.success(`${s.name.split(':')[0]} complete`, { description: 'Alerts and risk scores updated', action: { label: 'View', onClick: () => navigate(s.to) } });
          }
        }, 550 * (i + 1))
      );
    });
  };

  return (
    <>
      <PageHeader title="Data import & webhooks" description="Load records, test carrier integrations and launch demo scenarios. Everything here writes to the audit trail." />

      <section className="mb-6 grid gap-4 md:grid-cols-2" aria-label="Scenario launcher">
        {scenarios.map((s) => {
          const isRunning = running?.id === s.id;
          return (
            <Card key={s.id} className="flex flex-col p-5">
              <h2 className="text-[15px] font-semibold text-ink">{s.name}</h2>
              <p className="mt-1 text-sm text-muted">{s.description}</p>
              {isRunning &&
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={running.step} aria-valuemax={s.steps.length}>
                  <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${running.step / s.steps.length * 100}%` }} transition={{ duration: 0.25 }} />
                </div>
              }
              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <span className="text-xs text-muted">{s.steps.length} steps · ~3s</span>
                <Button size="sm" icon={<PlayIcon className="h-3.5 w-3.5" />} loading={isRunning} disabled={!!running && !isRunning} onClick={() => runScenario(s.id)}>
                  {isRunning ? 'Running' : 'Run scenario'}
                </Button>
              </div>
            </Card>);

        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ImportPanel />
        <div className="min-w-0 space-y-6">
          <WebhookPanel onEvent={addEvent} />
          <Card as="section">
            <CardHeader
              title="Live event log"
              description={`${log.length} events this session`}
              action={
              <button onClick={() => setLog([])} className="rounded-md p-1.5 text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink" aria-label="Clear log">
                  <Trash2Icon className="h-4 w-4" />
                </button>
              } />
            
            {log.length === 0 ?
            <EmptyState icon={WebhookIcon} title="No events yet" body="Send a test webhook or run a scenario to see events stream in." className="py-10" /> :

            <ul className="mt-3 max-h-80 divide-y divide-line overflow-y-auto" aria-live="polite">
                <AnimatePresence initial={false}>
                  {log.map((e) =>
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                  className="flex gap-3 px-5 py-2.5">
                  
                      <span className="w-16 shrink-0 pt-0.5 font-mono text-xs tabular-nums text-muted">{e.time}</span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
                          {e.kind === 'scenario' && <CheckIcon className="h-3.5 w-3.5 text-accent-ink" aria-hidden />}
                          {e.title}
                        </p>
                        <p className="truncate text-xs text-muted">{e.detail}</p>
                      </div>
                      <StatusChip tone={kindTone[e.kind]} className="self-start">
                        {kindLabel[e.kind]}
                      </StatusChip>
                    </motion.li>
                )}
                </AnimatePresence>
              </ul>
            }
          </Card>
        </div>
      </div>
    </>);

}