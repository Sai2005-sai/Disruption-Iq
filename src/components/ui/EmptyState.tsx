import React from "react";
import { cn } from "../../utils/cn";
import { BoxIcon } from "lucide-react";
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  action?: React.ReactNode;
  tone?: 'neutral' | 'error';
  className?: string;
}
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = 'neutral',
  className
}: EmptyStateProps) {
  return <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl', tone === 'error' ? 'bg-risk-critical/10 text-risk-critical-ink' : 'bg-surface-2 text-muted')}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>;
}