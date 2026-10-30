import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon, SirenIcon, StampIcon, InfoIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { DropdownPanel } from '../ui/DropdownPanel';
import { AppNotification } from '../../types/domain';
import { cn } from '../../utils/cn';

const icons: Record<AppNotification['type'], typeof BellIcon> = {
  alert: SirenIcon,
  approval: StampIcon,
  system: InfoIcon
};

export function NotificationsMenu() {
  const { notifications, markRead, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}>
        
        <BellIcon className="h-[18px] w-[18px]" />
        {unread > 0 &&
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-risk-critical px-1 text-[10px] font-semibold tabular-nums text-white">
            {unread}
          </span>
        }
      </button>
      <DropdownPanel open={open} className="w-[22rem] max-w-[calc(100vw-1.5rem)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          <button
            onClick={markAllRead}
            disabled={unread === 0}
            className="text-xs font-medium text-accent-ink transition-opacity duration-150 hover:underline disabled:opacity-40">
            
            Mark all read
          </button>
        </div>
        <ul className="max-h-96 divide-y divide-line overflow-y-auto">
          {notifications.map((n) => {
            const Icon = icons[n.type];
            return (
              <li key={n.id}>
                <button
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                    if (n.to) navigate(n.to);
                  }}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2">
                  
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      n.type === 'alert' ? 'bg-risk-critical/10 text-risk-critical-ink' : n.type === 'approval' ? 'bg-accent/10 text-accent-ink' : 'bg-surface-2 text-muted'
                    )}>
                    
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-sm', n.read ? 'text-ink-2' : 'font-medium text-ink')}>{n.title}</span>
                    <span className="block truncate text-xs text-muted">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{n.time}</span>
                  </span>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </button>
              </li>);

          })}
        </ul>
      </DropdownPanel>
    </div>);

}