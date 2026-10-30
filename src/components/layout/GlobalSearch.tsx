import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, XIcon, CornerDownLeftIcon } from 'lucide-react';
import { navGroups } from '../../data/navigation';
import { riskOrders } from '../../data/riskOrders';
import { alerts } from '../../data/alerts';
import { warehouses } from '../../data/warehouses';
import { useClickOutside } from '../../hooks/useClickOutside';
import { cn } from '../../utils/cn';

interface SearchItem {
  id: string;
  label: string;
  sub: string;
  to: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const index = useMemo<SearchItem[]>(
    () => [
    ...navGroups.flatMap((g) => g.items.map((i) => ({ id: i.path, label: i.label, sub: `Page · ${g.label}`, to: i.path }))),
    { id: 'SHP-7731', label: 'SHP-7731 · Apex Components Ltd', sub: 'Shipment · delayed 4 days', to: '/impact' },
    ...riskOrders.map((o) => ({ id: o.id, label: `${o.id} · ${o.customer}`, sub: 'Order at risk', to: '/orders' })),
    ...alerts.map((a) => ({ id: a.id, label: `${a.id} · ${a.title}`, sub: `Alert · ${a.source}`, to: '/alerts' })),
    ...warehouses.map((w) => ({ id: w.id, label: `${w.id} · ${w.name}`, sub: 'Warehouse', to: '/warehouses' }))],

    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.filter((i) => i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)).slice(0, 8);
  }, [query, index]);

  const close = useCallback(() => {
    setOpen(false);
    setMobileOpen(false);
  }, []);
  useClickOutside(ref, close, open || mobileOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setMobileOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (item: SearchItem) => {
    navigate(item.to);
    setQuery('');
    close();
  };

  return (
    <div ref={ref} className="sm:relative sm:w-full sm:max-w-md">
      <button
        onClick={() => {
          setMobileOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="rounded-lg p-2 text-ink-2 transition-colors duration-150 hover:bg-surface-2 sm:hidden"
        aria-label="Search">
        
        <SearchIcon className="h-5 w-5" />
      </button>
      <div
        className={cn(
          'sm:relative sm:block sm:p-0',
          mobileOpen ? 'absolute inset-x-0 top-0 z-[1050] block border-b border-line bg-surface p-3' : 'hidden'
        )}>
        
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) go(results[0]);
            }}
            placeholder="Search orders, alerts, warehouses…"
            aria-label="Global search"
            className="h-10 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-16 text-sm text-ink placeholder:text-muted transition-[border-color,box-shadow,background-color] duration-150 focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25" />
          
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 text-[11px] text-muted sm:block">
            ⌘K
          </kbd>
          {mobileOpen &&
          <button onClick={close} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted sm:hidden" aria-label="Close search">
              <XIcon className="h-4 w-4" />
            </button>
          }
        </div>
        {open && query.trim() &&
        <div className="absolute left-3 right-3 top-full z-[1060] mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-pop sm:left-0 sm:right-0">
            {results.length === 0 ?
          <p className="px-4 py-6 text-center text-sm text-muted">No matches for “{query}”</p> :

          <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
                {results.map((r, i) =>
            <li key={`${r.id}-${i}`}>
                    <button
                onClick={() => go(r)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-surface-2">
                
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{r.label}</span>
                        <span className="block text-xs text-muted">{r.sub}</span>
                      </span>
                      {i === 0 && <CornerDownLeftIcon className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
                    </button>
                  </li>
            )}
              </ul>
          }
          </div>
        }
      </div>
    </div>);

}