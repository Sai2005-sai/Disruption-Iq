import React, { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckIcon, ChevronDownIcon, ShieldIcon, UserCheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { canAccess, internalRoles, portalRoles, roleMeta } from '../../utils/roles';
import { Role } from '../../types/domain';
import { useClickOutside } from '../../hooks/useClickOutside';
import { DropdownPanel } from '../ui/DropdownPanel';
import { cn } from '../../utils/cn';

const roleDescriptions: Record<Role, string> = {
  delivery_agent: 'Driver on the road · reports delays & traffic with photos',
  partner_admin: 'Logistics controller · reviews alerts & initiates recovery plans',
  parent_company: 'Inventory owner · authorizes inter-warehouse transfers',
  customer: 'Customer recipient · tracks delivery & verified delay reasons',
  ops_analyst: 'Operations desk · classifies signals & assesses impact',
  scm: 'Supply Chain Manager · selects recovery plans & coordinates logistics',
  warehouse_operator: 'Facility operator · confirms on-hand inventory counts',
  procurement: 'Purchasing approver · authorizes freight budgets & spot POs',
  admin: 'System administrator · manages access, permissions & audit trail'
};

export function RoleSwitcher() {
  const { role, setRole } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const choose = (r: Role) => {
    setRole(r);
    setOpen(false);
    toast.success(`Now viewing as ${roleMeta[r].label}`, {
      description: `${roleMeta[r].user.name} (${roleMeta[r].org})`
    });
    if (!canAccess(r, location.pathname)) {
      navigate(roleMeta[r].home);
    }
  };

  const renderGroup = (label: string, roles: Role[]) => (
    <div className="py-2">
      <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      {roles.map((r) => {
        const isCurrent = r === role;
        return (
          <button
            key={r}
            onClick={() => choose(r)}
            className={cn(
              'flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors duration-150 hover:bg-surface-2',
              isCurrent && 'bg-accent/10'
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 font-semibold text-sm text-ink">
                {roleMeta[r].label}
                {isCurrent && <span className="text-[10px] text-accent-ink font-bold">• Active</span>}
              </span>
              <span className="block text-xs font-medium text-ink-2">
                {roleMeta[r].user.name} · {roleMeta[r].org}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted leading-tight">
                {roleDescriptions[r]}
              </span>
            </span>
            {isCurrent && <CheckIcon className="h-4 w-4 shrink-0 text-accent-ink mt-1" aria-label="Current role" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 pl-3 pr-2.5 text-[13px] font-semibold text-accent-ink transition hover:bg-accent/20 shadow-sm"
        title="Change user role to test role-based access control and separation of duties"
      >
        <UserCheckIcon className="h-4 w-4" />
        <span className="hidden sm:inline text-muted font-normal">Role:</span>
        <span className="font-semibold text-ink">{roleMeta[role].label}</span>
        <ChevronDownIcon className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      <DropdownPanel open={open} className="w-80 max-w-[calc(100vw-1.5rem)]">
        <div className="border-b border-line bg-surface-2/60 px-4 py-3">
          <p className="text-sm font-bold text-ink">Switch User Role</p>
          <p className="text-xs text-muted">
            Test role-based views and observe how separation of duties prevents self-approval.
          </p>
        </div>
        <div className="max-h-[75vh] divide-y divide-line overflow-y-auto">
          {renderGroup('Internal Approval & Operations Roles', internalRoles)}
        </div>
      </DropdownPanel>
    </div>
  );
}