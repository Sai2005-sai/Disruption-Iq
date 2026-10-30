import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: {items: Crumb[];}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted">
        {items.map((c, i) =>
        <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 opacity-60" aria-hidden />}
            {c.to ?
          <Link to={c.to} className="rounded transition-colors duration-150 hover:text-ink">
                {c.label}
              </Link> :

          <span className="text-ink-2" aria-current="page">
                {c.label}
              </span>
          }
          </li>
        )}
      </ol>
    </nav>);

}