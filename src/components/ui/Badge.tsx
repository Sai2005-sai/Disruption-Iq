import React from 'react';
import { RiskLevel, Severity } from '../../types/domain';
import { riskStyles, severityToRisk } from '../../utils/risk';
import { cn } from '../../utils/cn';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent' | 'orange';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink-2 ring-ink/10',
  info: 'bg-info/10 text-info-ink ring-info/20',
  success: 'bg-risk-low/10 text-risk-low-ink ring-risk-low/25',
  warning: 'bg-risk-moderate/10 text-risk-moderate-ink ring-risk-moderate/25',
  orange: 'bg-risk-high/10 text-risk-high-ink ring-risk-high/25',
  danger: 'bg-risk-critical/10 text-risk-critical-ink ring-risk-critical/25',
  accent: 'bg-accent/10 text-accent-ink ring-accent/25'
};

const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset';

export function StatusChip({ tone = 'neutral', children, className, dot }: {tone?: Tone;children: React.ReactNode;className?: string;dot?: boolean;}) {
  return (
    <span className={cn(base, tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>);

}

export function RiskBadge({ level, className, label }: {level: RiskLevel;className?: string;label?: string;}) {
  return (
    <span className={cn(base, riskStyles[level].badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', riskStyles[level].dot)} aria-hidden />
      {label ?? level}
    </span>);

}

export function SeverityBadge({ severity }: {severity: Severity | 'Unclassified';}) {
  if (severity === 'Unclassified') return <StatusChip tone="neutral">Unclassified</StatusChip>;
  return <RiskBadge level={severityToRisk[severity]} label={severity} />;
}