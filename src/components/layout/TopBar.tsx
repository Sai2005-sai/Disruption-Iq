import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MenuIcon, MoonIcon, SunIcon, ArrowLeftIcon, LogOutIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationsMenu } from './NotificationsMenu';
import { roleMeta } from '../../utils/roles';

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { dark, toggleDark, role, currentPortal, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Navigate back in history, or fallback to portal home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const home = roleMeta[role]?.home || '/';
      navigate(home);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Internal roles that can use the role switcher for separation of duties
  const isPartnerAdminOrOps = role === 'partner_admin' || role === 'ops_analyst' || role === 'scm' || role === 'admin';

  return (
    <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-3 sm:px-6">
      {/* Left: Mobile menu toggle + Back Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-ink-2 transition hover:bg-surface-2 lg:hidden"
          aria-label="Open navigation"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        {/* Universal Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm transition hover:bg-line hover:text-ink active:scale-95"
          title="Go back to previous screen"
        >
          <ArrowLeftIcon className="h-4 w-4 text-accent-ink" />
          <span>Back</span>
        </button>

        {/* Current Portal Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-line">
          <span className="text-xs font-semibold text-ink">
            {currentPortal ? currentPortal.portalName : roleMeta[role]?.label}
          </span>
          <span className="text-[11px] text-muted">({roleMeta[role]?.user.name})</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {isPartnerAdminOrOps && <RoleSwitcher />}

        <button
          onClick={toggleDark}
          className="rounded-lg p-2 text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
        </button>

        {isPartnerAdminOrOps && <NotificationsMenu />}

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 px-2.5 py-1.5 text-xs font-semibold text-risk-critical-ink hover:bg-red-100 dark:hover:bg-red-900/40 transition"
          title="Sign out of portal"
        >
          <LogOutIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}