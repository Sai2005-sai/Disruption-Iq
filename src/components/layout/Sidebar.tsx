import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ActivityIcon, XIcon, ArrowRightIcon, LogOutIcon, UserIcon } from 'lucide-react';
import { navGroups } from '../../data/navigation';
import { useApp } from '../../contexts/AppContext';
import { canAccess, roleMeta } from '../../utils/roles';
import { cn } from '../../utils/cn';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[1100] lg:hidden">
            <motion.div
              className="absolute inset-0 bg-slate-950/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />

            <motion.aside
              className="absolute inset-y-0 left-0 w-72 max-w-[85%]"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              <SidebarContent />
              <button
                onClick={onClose}
                className="absolute right-3 top-4 rounded-md p-1.5 text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                aria-label="Close navigation"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent() {
  const { role, currentPortal, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const homePath = roleMeta[role]?.home || '/';

  // Strict page filtering: ONLY show items that the current role is authorized to see!
  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccess(role, item.path))
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-sidebar text-white">
      {/* Brand & Portal Name */}
      <Link to={homePath} className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-navy">
          <ActivityIcon className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight">DisruptionIQ</span>
          <span className="block text-[11px] text-accent font-medium">
            {currentPortal ? currentPortal.portalName : roleMeta[role]?.label}
          </span>
        </span>
      </Link>

      {/* Navigation - STRICTLY isolated to accessible pages */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2.5 text-[11px] font-bold uppercase tracking-wider text-white/45">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150',
                          isActive
                            ? 'bg-accent/20 font-semibold text-white border-l-2 border-accent'
                            : 'text-white/75 hover:bg-white/5 hover:text-white'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-accent' : 'text-white/60')} aria-hidden />
                          <span className="flex-1 truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Active Incident Notice - ONLY shown for partner_admin / internal supply chain roles */}
      {canAccess(role, '/impact') && (
        <div className="border-t border-white/10 p-3">
          <Link
            to="/impact"
            className="group block rounded-lg bg-white/5 p-3 transition-colors duration-150 hover:bg-white/10"
          >
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-risk-high" aria-hidden />
              Active Incident · DIS-2041
            </div>
            <p className="mt-1 text-[13px] font-medium leading-snug text-white">
              Chennai short 120 units · 12 orders exposed
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-accent">
              View impact <ArrowRightIcon className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      )}

      {/* User Info & Sign Out Button */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-accent">
            {roleMeta[role]?.user.initials || 'U'}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <span className="block truncate text-xs font-semibold text-white">
              {roleMeta[role]?.user.name}
            </span>
            <span className="block truncate text-[10px] text-white/50">
              {roleMeta[role]?.org}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 hover:text-white transition"
        >
          <LogOutIcon className="h-3.5 w-3.5" />
          <span>Sign Out / Switch Portal</span>
        </button>
      </div>
    </div>
  );
}