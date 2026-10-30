import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActivityIcon,
  MailIcon,
  LockIcon,
  TruckIcon,
  Building2Icon,
  FactoryIcon,
  UserCheckIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  ShieldAlertIcon,
  CopyIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../contexts/AppContext';
import { portalCredentials, findCredential, PortalCredential } from '../data/authCredentials';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { cn } from '../utils/cn';

const portalIcons = {
  agent: TruckIcon,
  admin: Building2Icon,
  parent: FactoryIcon,
  customer: UserCheckIcon
};

export function Login() {
  const navigate = useNavigate();
  const { loginWithCredential } = useApp();

  const [selectedPortal, setSelectedPortal] = useState<PortalCredential>(portalCredentials[1]); // Default to Partner Admin
  const [email, setEmail] = useState(portalCredentials[1].email);
  const [password, setPassword] = useState(portalCredentials[1].password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectPortal = (portal: PortalCredential) => {
    setSelectedPortal(portal);
    setEmail(portal.email);
    setPassword(portal.password);
    setError('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const matched = findCredential(email, password);
    if (!matched) {
      setError('Invalid credentials! You must enter one of the 4 exact portal credentials shown on this page.');
      toast.error('Authentication failed', {
        description: 'Please select one of the 4 portals or enter its exact email & password.'
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      loginWithCredential(matched);
      toast.success(`Signed into ${matched.portalName}`, {
        description: `Welcome, ${matched.userName} (${matched.org})`
      });
      navigate(matched.accessiblePages[0].path);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-ink flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-accent shadow-sm">
              <ActivityIcon className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div>
              <span className="block text-base font-bold tracking-tight text-ink">DisruptionIQ</span>
              <span className="block text-xs text-muted">Supply Chain Disruption &amp; Recovery Platform</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-ink-2">
              <span className="h-2 w-2 rounded-full bg-risk-low animate-pulse" />
              Live 4-Portal Environment
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Choose Your Portal to Sign In
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
            Each portal has dedicated login credentials and gives access <strong>only</strong> to its authorized pages.
            Click any portal below to auto-fill its credentials, or type them in manually.
          </p>
        </div>

        {/* 4 Portals Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {portalCredentials.map((portal) => {
            const Icon = portalIcons[portal.portalId];
            const isSelected = selectedPortal.portalId === portal.portalId;

            return (
              <button
                key={portal.portalId}
                type="button"
                onClick={() => handleSelectPortal(portal)}
                className={cn(
                  'relative flex flex-col justify-between rounded-xl border p-5 text-left transition-all shadow-card hover:shadow-pop text-ink',
                  isSelected
                    ? 'border-accent ring-2 ring-accent/30 bg-surface'
                    : 'border-line bg-surface hover:border-accent/50'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg shadow-sm',
                        isSelected ? 'bg-accent text-navy' : 'bg-surface-2 text-ink-2'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-ink">
                        <CheckCircle2Icon className="h-4 w-4" /> Selected
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-ink leading-tight">{portal.portalName}</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-2">{portal.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-line space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px] bg-surface-2/80 px-2 py-1 rounded">
                    <span className="text-muted">Email:</span>
                    <span className="font-semibold text-ink">{portal.email}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] bg-surface-2/80 px-2 py-1 rounded">
                    <span className="text-muted">Password:</span>
                    <span className="font-semibold text-ink">{portal.password}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1">
                      Allowed Pages ({portal.accessiblePages.length}):
                    </span>
                    <ul className="text-[11px] text-ink-2 space-y-0.5">
                      {portal.accessiblePages.map((p) => (
                        <li key={p.path} className="truncate">
                          • {p.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Portal Sign-In Form Box */}
        <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
          <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 text-accent-ink font-bold text-xs">
              ✓
            </span>
            <div>
              <h2 className="text-sm font-bold text-ink">Sign into {selectedPortal.portalName}</h2>
              <p className="text-xs text-muted">{selectedPortal.userName} · {selectedPortal.org}</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
            <Field label="Portal Email" htmlFor="login-email" required>
              <div className="relative">
                <MailIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} pl-9 font-mono text-xs`}
                  placeholder="name@swiftlane.in"
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="login-password" required>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="login-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pl-9 font-mono text-xs`}
                  placeholder="Enter portal password"
                />
              </div>
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-risk-critical/10 p-3 text-xs text-risk-critical-ink">
                <ShieldAlertIcon className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full justify-center" loading={loading} icon={<ArrowRightIcon className="h-4 w-4" />}>
              Sign into {selectedPortal.portalName}
            </Button>
          </form>

          <div className="mt-4 rounded-lg bg-surface-2 p-3 text-[11px] text-muted space-y-1">
            <p className="font-semibold text-ink">Strict Portal Isolation Active:</p>
            <p>
              Once you sign in, the sidebar will <strong>only show the {selectedPortal.accessiblePages.length} pages</strong> belonging to this login. All other pages and admin options are completely blocked.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-4 text-center text-xs text-muted">
        DisruptionIQ © 2026 · 4-Portal Role-Based Access Control System
      </footer>
    </div>
  );
}