"use client";
import { useState } from 'react';
import { Key, ShieldCheck, AlertCircle, Loader2, LogOut, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLicense } from '@/lib/license';
import Link from 'next/link';

export default function LicensePage() {
  const { license, isPro, deactivate, activate } = useLicense();
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDeactivate, setShowConfirmDeactivate] = useState(false);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await activate(key);

      if (result.success) {
        setSuccess('License activated successfully! All features are now unlocked.');
        setKey('');
      } else {
        setError(result.error || 'Failed to activate license');
      }
    } catch {
      setError('Network error activating license');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    setLoading(true);
    setError('');
    try {
      await deactivate();
      setShowConfirmDeactivate(false);
      setSuccess('License deactivated successfully on this device.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to deactivate license');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Key className="w-6 h-6 text-zinc-500" />
          License Management
        </h1>
        <p className="text-zinc-500 text-sm">
          Activate your standalone license key to unlock your mailbox, campaigns, and premium features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 border-b pb-4">
            {isPro ? 'Active License' : 'Activate License'}
          </h2>

          {!isPro ? (
            <form onSubmit={handleActivate} className="flex-1 flex flex-col">
              <label className="block text-sm font-medium mb-2 text-zinc-700">Enter License Key</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="NEXUS-XXXXX-XXXXX-XXXXX"
                className="w-full border-2 border-zinc-200 rounded-lg px-4 py-3 font-mono text-center tracking-widest outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase mb-4"
                disabled={loading}
              />

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start gap-2 text-sm mb-4 border border-red-100">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-md flex items-start gap-2 text-sm mb-4 border border-green-100">
                  <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>License activated successfully!</p>
                </div>
              )}

              <div className="mt-auto pt-4">
                <button
                  type="submit"
                  disabled={loading || !key.trim()}
                  className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                  Activate License
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-green-900">License is Active</div>
                  <div className="text-xs text-green-700">All premium capabilities are unlocked on this device.</div>
                </div>
              </div>

              <div className="space-y-3 text-sm py-2 flex-1">
                <div className="flex justify-between py-1 border-b text-zinc-600">
                  <span>License Key:</span>
                  <span className="font-mono font-medium text-zinc-900">{license?.licenseKey}</span>
                </div>
                <div className="flex justify-between py-1 border-b text-zinc-600">
                  <span>Type:</span>
                  <span className="font-semibold capitalize text-zinc-900">{license?.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b text-zinc-600">
                  <span>Expires:</span>
                  <span className="font-medium text-zinc-900">
                    {license?.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never (Lifetime)'}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                {showConfirmDeactivate ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
                    <p className="font-semibold text-red-900">Deactivate license on this device?</p>
                    <p className="text-red-700">This will release 1 device slot in Neon and lock mailbox features on this browser.</p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleDeactivate}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded font-medium transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Deactivating...' : 'Yes, Deactivate'}
                      </button>
                      <button
                        onClick={() => setShowConfirmDeactivate(false)}
                        disabled={loading}
                        className="bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 py-1.5 px-3 rounded font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDeactivate(true)}
                    disabled={loading}
                    className="w-full border border-red-200 text-red-600 hover:bg-red-50 rounded-lg py-2.5 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Deactivate / Switch Key
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-50 rounded-xl border p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 pb-4">Status Overview</h2>

          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center py-2 border-b border-zinc-200">
              <span className="text-sm font-medium text-zinc-500">Current Status</span>
              <span
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-semibold',
                  isPro ? 'bg-green-100 text-green-700' : 'bg-zinc-200 text-zinc-600'
                )}
              >
                {isPro ? 'PRO ACTIVE' : 'UNREGISTERED'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-200">
              <span className="text-sm font-medium text-zinc-500">Plan Type</span>
              <span className="text-sm font-semibold capitalize text-zinc-900">
                {isPro ? license?.type : 'Free Mode (Limited)'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-200">
              <span className="text-sm font-medium text-zinc-500">Device Limit</span>
              <span className="text-sm font-semibold text-zinc-900">
                {license?.deviceLimit ? `${license.deviceLimit} Devices` : 'Default: 3 Devices'}
              </span>
            </div>
          </div>

          <div className="mt-6 text-xs text-zinc-500 bg-white p-3 rounded border">
            <p className="font-medium mb-1 text-zinc-700">Pure Key Licensing (No User Accounts)</p>
            You do not need user accounts or signups. Keys can be validated directly on activation and stored in the application state.
          </div>
        </div>
      </div>
    </div>
  );
}
