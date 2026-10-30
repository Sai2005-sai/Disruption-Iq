import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleCheckIcon, XCircleIcon, LoaderCircleIcon, CircleDashedIcon, TriangleAlertIcon } from 'lucide-react';
import { Role } from '../../types/domain';
import { roleMeta } from '../../utils/roles';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';

interface Check {
  label: string;
  pass: boolean;
  detail: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  role: Role;
  quantity: number;
  onExecute: (simulateConcurrentChange: boolean) => void;
  onStale: (reason: string) => void;
}

const executors: Role[] = ['scm', 'partner_admin', 'admin'];

function buildChecks(inject: boolean, role: Role, qty: number): Check[] {
  const available = inject ? 95 : 120;
  return [
  {
    label: 'Stock re-checked at WH-BLR-02',
    pass: available >= qty,
    detail: inject ? `Only ${available} free units — RC-2038 reserved 85 units at 10:51` : `${available} free units ≥ ${qty} required`
  },
  { label: 'Deadlines still achievable', pass: true, detail: 'Transfer ETA 6h 40m · earliest deadline ORD-10482 in 17h' },
  {
    label: 'Executor permissions valid',
    pass: executors.includes(role),
    detail: executors.includes(role) ? `${roleMeta[role].label} may execute simulations` : `${roleMeta[role].label} lacks “Execute simulation” permission`
  },
  {
    label: 'No double-allocation',
    pass: !inject,
    detail: inject ? '85 units already committed to RC-2038 overlap this plan' : 'Units not reserved by any other open plan'
  },
  { label: 'Plan freshness', pass: !inject, detail: inject ? 'Source stock changed after approval' : 'Inputs unchanged since final approval' }];

}

export function RevalidationModal({ open, onClose, role, quantity, onExecute, onStale }: Props) {
  const [inject, setInject] = useState(false);
  const [progress, setProgress] = useState(-1);
  const [checks, setChecks] = useState<Check[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setProgress(-1);
      setChecks([]);
      window.clearInterval(timer.current);
    }
  }, [open]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const run = () => {
    const list = buildChecks(inject, role, quantity);
    setChecks(list);
    setProgress(0);
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1;
      setProgress(i);
      if (i >= list.length) window.clearInterval(timer.current);
    }, 420);
  };

  const done = checks.length > 0 && progress >= checks.length;
  const allPass = done && checks.every((c) => c.pass);
  const staleFail = done && !allPass && checks.some((c) => !c.pass && (c.label.startsWith('Stock') || c.label.startsWith('No double') || c.label.startsWith('Plan freshness')));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Revalidate before execution"
      description="RC-2041 · every check must pass at the moment of execution"
      footer={
      !done ?
      <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={run} loading={progress >= 0 && !done}>
              Run checks
            </Button>
          </> :
      allPass ?
      <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onExecute(inject)}>Confirm simulated execution</Button>
          </> :
      staleFail ?
      <>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="danger" onClick={() => onStale('Revalidation failed: stock changed after approval (double-allocation with RC-2038)')}>
              Send back for re-approval
            </Button>
          </> :

      <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

      }>
      
      {progress < 0 &&
      <div className="mb-4 rounded-lg border border-dashed border-line p-3">
          <Switch
          checked={inject}
          onChange={setInject}
          label="Simulate a concurrent stock change"
          description="Demo: another plan reserves Bengaluru stock after this plan was approved" />
        
        </div>
      }

      <ul className="space-y-1">
        {(checks.length ? checks : buildChecks(inject, role, quantity)).map((c, i) => {
          const state = progress < 0 || i > progress ? 'idle' : i === progress && !done ? 'running' : c.pass ? 'pass' : 'fail';
          return (
            <li key={c.label} className="flex items-start gap-3 rounded-lg px-2 py-2.5">
              <span className="mt-0.5">
                {state === 'idle' && <CircleDashedIcon className="h-4 w-4 text-muted" aria-label="Pending" />}
                {state === 'running' && <LoaderCircleIcon className="h-4 w-4 animate-spin text-accent-ink" aria-label="Running" />}
                {state === 'pass' && <CircleCheckIcon className="h-4 w-4 text-risk-low-ink" aria-label="Pass" />}
                {state === 'fail' && <XCircleIcon className="h-4 w-4 text-risk-critical-ink" aria-label="Fail" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-ink">{c.label}</span>
                {(state === 'pass' || state === 'fail') &&
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className={state === 'fail' ? 'block text-xs text-risk-critical-ink' : 'block text-xs text-muted'}>
                    {c.detail}
                  </motion.span>
                }
              </span>
            </li>);

        })}
      </ul>

      {done && !allPass &&
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-4 flex gap-3 rounded-lg border border-risk-critical/30 bg-risk-critical/10 p-3 text-sm text-ink-2">
        
          <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-risk-critical-ink" aria-hidden />
          <div>
            <p className="font-medium text-ink">{staleFail ? 'Stale plan — re-approval required' : 'Execution blocked'}</p>
            <p className="mt-0.5">
              {staleFail ?
            'The approved inputs no longer match reality. The plan must go back through the full approval chain before it can run.' :
            'Switch to a role with the “Execute simulation” permission (e.g. Supply Chain Manager).'}
            </p>
          </div>
        </motion.div>
      }
      {allPass &&
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-lg bg-risk-low/10 px-3 py-2 text-sm text-risk-low-ink">
          All 5 checks passed. Execution is simulated — no real stock moves.
        </motion.p>
      }
    </Modal>);

}