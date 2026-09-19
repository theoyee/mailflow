"use client";
import { useState } from 'react';
import { Key, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LicensePage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // In a real desktop app, we'd load the active license from safeStorage
  const [activeLicense, setActiveLicense] = useState<any>(null); 

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!key) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key, deviceName: 'My Work Desktop' }) // Usually read from OS
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
        setActiveLicense(data.license);
        // Would save deviceId and license details to local SQLite/Keychain here
      } else {
        setError(data.error || 'Failed to activate license');
      }
    } catch (err) {
      setError('Network error activating license');
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
        <p className="text-zinc-500 text-sm">Activate your NexusMail AI Pro license to unlock unlimited AI generations, bulk sending, and campaign management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 border-b pb-4">Activation</h2>
          
          <form onSubmit={handleActivate} className="flex-1 flex flex-col">
            <label className="block text-sm font-medium mb-2 text-zinc-700">Enter License Key</label>
            <input 
              type="text" 
              value={key}
              onChange={e => setKey(e.target.value.toUpperCase())}
              placeholder="NEXUS-XXXXX-XXXXX-XXXXX" 
              className="w-full border-2 border-zinc-200 rounded-lg px-4 py-3 font-mono text-center tracking-widest outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all uppercase mb-4"
              disabled={loading || !!activeLicense}
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
                disabled={loading || !key || !!activeLicense}
                className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                {activeLicense ? 'Activated' : 'Activate License'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-zinc-50 rounded-xl border p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 border-b border-zinc-200 pb-4">Status Overview</h2>
          
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center py-2 border-b border-zinc-200">
              <span className="text-sm font-medium text-zinc-500">Current Status</span>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                activeLicense ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"
              )}>
                {activeLicense ? 'PRO ACTIVE' : 'UNREGISTERED'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-zinc-200">
              <span className="text-sm font-medium text-zinc-500">Plan Type</span>
              <span className="text-sm font-semibold capitalize text-zinc-900">
                {activeLicense ? activeLicense.type : 'Free Trial (Basic)'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-zinc-200">
              <span className="text-sm font-medium text-zinc-500">Expires</span>
              <span className="text-sm font-semibold text-zinc-900">
                {activeLicense && activeLicense.expiresAt 
                  ? new Date(activeLicense.expiresAt).toLocaleDateString() 
                  : (activeLicense?.type === 'lifetime' ? 'Never' : 'N/A')}
              </span>
            </div>
          </div>
          
          <div className="mt-6 text-xs text-zinc-400 bg-white p-3 rounded border">
            <p className="font-medium mb-1 text-zinc-500">Offline Grace Period</p>
            Your license is cached securely offline. You must connect to the internet at least once every 14 days to re-validate your active subscription.
          </div>
        </div>
      </div>
    </div>
  );
}
