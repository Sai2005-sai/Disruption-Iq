import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MenuIcon, MoonIcon, SunIcon, ArrowLeftIcon, LogOutIcon, SparklesIcon, KeyIcon, CheckCircle2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { NotificationsMenu } from './NotificationsMenu';
import { roleMeta } from '../../utils/roles';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { dark, toggleDark, role, currentPortal, logout, configureAiKey, getAiKeyStatus } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<{ hasKey: boolean; keyMasked: string | null; provider: string }>({
    hasKey: false,
    keyMasked: null,
    provider: 'Google Gemini'
  });

  useEffect(() => {
    getAiKeyStatus()
      .then((status) => setKeyStatus(status))
      .catch(() => {});
  }, [getAiKeyStatus]);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) {
      toast.error('Please enter a valid Gemini API key.');
      return;
    }
    setIsSavingKey(true);
    try {
      const res = await configureAiKey(apiKeyInput.trim());
      setKeyStatus({
        hasKey: true,
        keyMasked: res.keyMasked || null,
        provider: 'Google Gemini'
      });
      toast.success('Gemini API key configured successfully!', {
        description: 'DisruptionIQ AI solvers are now live with Google Gemini.'
      });
      setAiModalOpen(false);
      setApiKeyInput('');
    } catch (err: any) {
      toast.error('Failed to configure API key', {
        description: err.message || 'Check your key and try again.'
      });
    } finally {
      setIsSavingKey(false);
    }
  };

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

  // Internal roles that can use notifications
  const isPartnerAdminOrOps = role === 'partner_admin' || role === 'ops_analyst' || role === 'scm' || role === 'admin';

  return (
    <>
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
          {/* Gemini AI Status / Settings Trigger */}
          <button
            onClick={() => setAiModalOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
              keyStatus.hasKey
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15'
            }`}
            title="Gemini AI Key & Status Settings"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{keyStatus.hasKey ? 'Gemini AI: Live' : 'AI Key'}</span>
          </button>

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

      {/* Gemini AI Settings Modal */}
      {aiModalOpen && (
        <Modal
          open={aiModalOpen}
          onClose={() => setAiModalOpen(false)}
          title="Google Gemini AI Configuration"
          description="Power DisruptionIQ with real-time generative intelligence for Order Risk, Driver Delays, and Warehouse Replenishment."
          footer={
            <>
              <Button variant="secondary" onClick={() => setAiModalOpen(false)} disabled={isSavingKey}>
                Cancel
              </Button>
              <Button onClick={handleSaveKey} loading={isSavingKey} icon={<KeyIcon className="h-4 w-4" />}>
                Save & Activate Key
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {keyStatus.hasKey ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Gemini API is Connected
                </div>
                <p className="text-xs">
                  Active Key: <span className="font-mono font-bold">{keyStatus.keyMasked}</span>
                </p>
                <p className="text-[11px] text-muted">
                  DisruptionIQ automatically utilizes models gemini-3.8-flash, gemini-3.5-flash, and gemini-3.5 for real-time disruption mitigation.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
                <p className="font-semibold text-sm">No Gemini API Key Configured</p>
                <p className="mt-1 text-xs">
                  A high-fidelity deterministic fallback engine is active. Paste your Google Gemini API key below to enable live generative AI responses from Gemini 3.8 / 3.5.
                </p>
              </div>
            )}

            <Field
              label="Gemini API Key"
              htmlFor="gemini-key"
              hint="Keys start with AIzaSy... Get one from Google AI Studio (aistudio.google.com)"
            >
              <input
                id="gemini-key"
                type="password"
                placeholder={keyStatus.hasKey ? 'Enter new key to replace existing...' : 'AIzaSy...'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}