"use client";
import { usePathname } from 'next/navigation';
import { useLicense } from '@/lib/license';
import { useState } from 'react';
import { Key, Lock, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function LicenseGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isPro, loading, activate } = useLicense();
  const [quickKey, setQuickKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');

  // Configuration pages (/settings) and admin portal (/admin) are accessible without a client license
  const isBypassed = pathname.startsWith('/settings') || pathname.startsWith('/admin');

  async function handleQuickActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!quickKey.trim()) return;

    setActivating(true);
    setError('');

    try {
      const result = await activate(quickKey);
      if (result.success) {
        setQuickKey('');
      } else {
        setError(result.error || 'Failed to activate license');
      }
    } catch {
      setError('Connection error activating license');
    } finally {
      setActivating(false);
    }
  }

  // If loading license status, render neutral skeleton/spinner to avoid layout shift
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // If user is accessing settings or admin, always allow
  if (isBypassed) {
    return <>{children}</>;
  }

  // If user has an active license, allow mailbox access
  if (isPro) {
    return <>{children}</>;
  }

  // Otherwise, lock the mailbox view
  return (
    <div className="flex h-full items-center justify-center p-6 bg-zinc-50/80">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold text-zinc-900 mb-2">Mailbox Access Locked</h2>
        <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
          An active license key is required to access your mailbox, compose emails, manage contacts, and run campaigns.
        </p>

        {/* Quick Activation Form */}
        <form onSubmit={handleQuickActivate} className="mb-6 text-left">
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-2">
            Enter License Key
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickKey}
              onChange={(e) => setQuickKey(e.target.value.toUpperCase())}
              placeholder="NEXUS-XXXXX-XXXXX-XXXXX"
              className="flex-1 border-2 border-zinc-200 rounded-lg px-3 py-2.5 font-mono text-sm tracking-wider uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              disabled={activating}
            />
            <button
              type="submit"
              disabled={activating || !quickKey.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Unlock
            </button>
          </div>

          {error && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <Link
            href="/settings/license"
            className="hover:text-blue-600 font-medium inline-flex items-center gap-1"
          >
            Open License Settings
            <ArrowRight className="w-3 h-3" />
          </Link>

          <span className="text-zinc-400">
            Standalone license required
          </span>
        </div>
      </div>
    </div>
  );
}
