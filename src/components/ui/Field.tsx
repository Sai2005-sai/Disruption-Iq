import React from 'react';

export const inputClass =
'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-risk-critical-ink">*</span>}
      </label>
      {children}
      {error ?
      <p className="mt-1.5 text-xs text-risk-critical-ink" role="alert">
          {error}
        </p> :

      hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      }
    </div>);

}