import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { roleMeta } from '../../utils/roles';
import { useClickOutside } from '../../hooks/useClickOutside';
import { DropdownPanel } from '../ui/DropdownPanel';

export function UserMenu() {
  const { user, role } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-fg ring-2 ring-surface transition-transform duration-150 active:scale-95"
        aria-label={`Account menu for ${user.name}`}
        aria-expanded={open}>
        
        {user.initials}
      </button>
      <DropdownPanel open={open} className="w-64">
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-semibold text-ink">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-ink-2">
            {roleMeta[role].label} · {roleMeta[role].org}
          </p>
        </div>
        <button
          onClick={() => {
            setOpen(false);
            toast('Signed out');
            navigate('/');
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink">
          
          <LogOutIcon className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </DropdownPanel>
    </div>);

}