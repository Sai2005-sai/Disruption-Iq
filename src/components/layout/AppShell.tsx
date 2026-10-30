import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { RestrictedState } from './RestrictedState';
import { useApp } from '../../contexts/AppContext';
import { canAccess, roleMeta } from '../../utils/roles';
import { GuidedBanner } from './GuidedBanner';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, isAuthenticated } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);

  // If not logged in, redirect to login page
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setMobileOpen(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  const allowed = canAccess(role, location.pathname);

  // Auto-redirect if trying to access a blocked page
  useEffect(() => {
    if (isAuthenticated && !allowed) {
      const home = roleMeta[role]?.home || '/login';
      navigate(home, { replace: true });
    }
  }, [isAuthenticated, allowed, role, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  // Only show GuidedBanner for Partner Admin or Administrator
  const showGuide = role === 'partner_admin' || role === 'admin';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileOpen(true)} />
        {showGuide && <GuidedBanner />}
        <main ref={mainRef} id="main" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {allowed ? <Outlet /> : <RestrictedState path={location.pathname} />}
          </div>
        </main>
      </div>
    </div>
  );
}