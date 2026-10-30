import React from 'react';
import { cn } from '../../utils/cn';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({ tabs, value, onChange, className }: {tabs: TabItem[];value: string;onChange: (id: string) => void;className?: string;}) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative -mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
              active ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            )}>
            
            {t.label}
            {t.count !== undefined &&
            <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', active ? 'bg-accent/15 text-accent-ink' : 'bg-surface-2 text-muted')}>
                {t.count}
              </span>
            }
          </button>);

      })}
    </div>);

}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label





}: {options: {id: T;label: string;}[];value: T;onChange: (v: T) => void;label: string;}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((o) =>
      <button
        key={o.id}
        role="radio"
        aria-checked={o.id === value}
        onClick={() => onChange(o.id)}
        className={cn(
          'whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150',
          o.id === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
        )}>
        
          {o.label}
        </button>
      )}
    </div>);

}