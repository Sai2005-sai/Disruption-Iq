import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CompassIcon,
  ChevronRightIcon,
  PlayIcon,
  RotateCcwIcon,
  CheckCircle2Icon,
  SparklesIcon,
  HelpCircleIcon,
  XIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  InfoIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { guidedSteps, useApp } from '../../contexts/AppContext';
import { roleMeta } from '../../utils/roles';
import { Role } from '../../types/domain';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export function GuidedBanner() {
  const {
    beginnerMode,
    toggleBeginnerMode,
    guidedStepIdx,
    setGuidedStepIdx,
    role,
    runScenario,
    workflow
  } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = guidedSteps[guidedStepIdx] || guidedSteps[0];
  const isCorrectRole = role === currentStep.roleNeeded || role === 'admin';

  const handleStepClick = (idx: number) => {
    setGuidedStepIdx(idx);
    const target = guidedSteps[idx];
    navigate(target.route);
  };

  const handleQuickAction = () => {
    navigate(currentStep.route);
  };

  const executeScenario = async (id: string, name: string) => {
    setRunning(id);
    const res = await runScenario(id);
    setRunning(null);
    if (res.success) {
      toast.success(`${name} activated`, {
        description: 'Synthetic disruption data synchronized with SQLite database.'
      });
      if (id === 'scn-1') {
        setGuidedStepIdx(0);
        navigate('/alerts');
      } else if (id === 'scn-2') {
        navigate('/alerts');
      } else {
        toast.info('Database restored to default baseline.');
      }
    } else {
      toast.error('Failed to trigger scenario: ' + res.message);
    }
  };

  if (!beginnerMode) {
    return (
      <div className="border-b border-line bg-surface px-4 py-2 text-xs flex items-center justify-between text-muted">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span>DisruptionIQ Live System • Hosur–Bengaluru–Chennai Corridor</span>
        </div>
        <button
          onClick={toggleBeginnerMode}
          className="inline-flex items-center gap-1.5 font-medium text-accent-ink hover:underline"
        >
          <CompassIcon className="h-3.5 w-3.5" />
          Enable Beginner Guided Tour
        </button>
      </div>
    );
  }

  return (
    <div className="relative border-b border-accent/30 bg-gradient-to-r from-accent/10 via-surface to-accent/5">
      <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-navy shadow-sm">
              <CompassIcon className="h-4.5 w-4.5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-ink">
                  Beginner Guided Tour
                </span>
                <span className="text-[11px] text-muted">• Step {guidedStepIdx + 1} of 6</span>
              </div>
              <h2 className="text-sm font-semibold text-ink leading-tight">
                {currentStep.title}
              </h2>
            </div>
          </div>

          {/* Quick Scenario Launchers */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => executeScenario('scn-1', 'Scenario 1 (Supplier Delay)')}
              disabled={!!running}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink shadow-sm transition hover:bg-surface-2 disabled:opacity-50"
              title="Demonstrates factory oven breakdown, 120-unit shortage, and 6 affected customer orders"
            >
              <PlayIcon className="h-3 w-3 text-accent" />
              <span>Scenario 1: Supplier Stoppage</span>
            </button>

            <button
              onClick={() => executeScenario('scn-2', 'Scenario 2 (Carrier Webhook)')}
              disabled={!!running}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink shadow-sm transition hover:bg-surface-2 disabled:opacity-50"
              title="Simulates BlueDart carrier webhook delay (+9h) with idempotency key"
            >
              <PlayIcon className="h-3 w-3 text-info" />
              <span>Scenario 2: Carrier Webhook</span>
            </button>

            <button
              onClick={() => executeScenario('reset', 'Reset Baseline')}
              disabled={!!running}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-muted hover:text-ink hover:bg-surface-2"
              title="Reset synthetic SQLite data to initial baseline"
            >
              <RotateCcwIcon className="h-3 w-3" />
              <span className="hidden sm:inline">Reset DB</span>
            </button>

            <button
              onClick={() => setShowGlossary(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-muted hover:text-ink"
              title="View simple explanations of logistics concepts"
            >
              <HelpCircleIcon className="h-3.5 w-3.5 text-accent-ink" />
              <span className="hidden md:inline">Glossary</span>
            </button>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded p-1 text-muted hover:text-ink"
              aria-label={collapsed ? 'Expand guide' : 'Collapse guide'}
            >
              {collapsed ? 'Expand' : 'Hide'}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-3 pt-3 border-t border-accent/20 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-ink-2 max-w-2xl leading-relaxed">
                {currentStep.desc}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                <span>Recommended Role:</span>
                <span className="font-medium text-ink">
                  {roleMeta[currentStep.roleNeeded].label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {guidedStepIdx > 0 && (
                <button
                  onClick={() => handleStepClick(guidedStepIdx - 1)}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:text-ink"
                >
                  Previous
                </button>
              )}

              <Button size="sm" onClick={handleQuickAction} icon={<ArrowRightIcon className="h-3.5 w-3.5" />}>
                {currentStep.actionLabel}
              </Button>

              {guidedStepIdx < guidedSteps.length - 1 && (
                <button
                  onClick={() => handleStepClick(guidedStepIdx + 1)}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step Progress Bar */}
        {!collapsed && (
          <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
            {guidedSteps.map((step, idx) => {
              const isCurrent = idx === guidedStepIdx;
              const isDone = idx < guidedStepIdx;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(idx)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors',
                    isCurrent
                      ? 'bg-accent text-navy shadow-sm'
                      : isDone
                      ? 'bg-surface text-ink-2 hover:bg-surface-2'
                      : 'bg-surface/50 text-muted hover:bg-surface'
                  )}
                >
                  {isDone ? (
                    <CheckCircle2Icon className="h-3 w-3 text-risk-low-ink" />
                  ) : (
                    <span className="text-[10px] opacity-75">{idx + 1}</span>
                  )}
                  <span>{step.title.split('. ')[1]}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Beginner Glossary Modal */}
      {showGlossary && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="relative max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-pop">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5 text-accent-ink" />
                <h3 className="text-base font-semibold text-ink">Supply Chain Terms Explained</h3>
              </div>
              <button
                onClick={() => setShowGlossary(false)}
                className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-lg bg-surface-2 p-3">
                <h4 className="font-semibold text-ink">SLA (Service Level Agreement)</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  The contractual delivery deadline agreed with the customer. If delivery misses the SLA window, penalties or production line shutdowns occur.
                </p>
              </div>

              <div className="rounded-lg bg-surface-2 p-3">
                <h4 className="font-semibold text-ink">Separation of Duties (No Self-Approval)</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  A strict internal control preventing the person who created a recovery plan from approving it themselves. Another qualified manager must verify and approve it.
                </p>
              </div>

              <div className="rounded-lg bg-surface-2 p-3">
                <h4 className="font-semibold text-ink">Deterministic Risk Score</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  A calculated 0–100 score based on 4 concrete mathematical weights: Deadline Proximity (max 35) + Stock Shortage (max 25) + Order Priority (max 20) + Disruption Severity (max 20).
                </p>
              </div>

              <div className="rounded-lg bg-surface-2 p-3">
                <h4 className="font-semibold text-ink">Carrier Webhook & Idempotency</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Automated notifications sent by freight carriers (like BlueDart or Delhivery). DisruptionIQ checks unique idempotency keys so replayed or duplicate messages are safely ignored.
                </p>
              </div>

              <div className="rounded-lg bg-surface-2 p-3">
                <h4 className="font-semibold text-ink">Stock Reallocation vs Transfer</h4>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Moving surplus uncommitted inventory from one warehouse (Bengaluru Hoskote) to cover critical shortages at another site (Chennai Ambattur).
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button size="sm" onClick={() => setShowGlossary(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
