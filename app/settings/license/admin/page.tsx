"use client";
import { useState } from 'react';
import { Key, Plus, Copy, Check } from 'lucide-react';

export default function LicenseAdminPage() {
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateKey() {
    setLoading(true);
    try {
      const res = await fetch('/api/license/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lifetime' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedKey(data.license.licenseKey);
        setCopied(false);
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Key className="w-6 h-6 text-zinc-500" />
          License Admin Panel
        </h1>
        <p className="text-zinc-500 text-sm">Generate new license keys to manually sell or distribute to your users.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col gap-6">
        <button
          onClick={generateKey}
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg py-3 px-6 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {loading ? 'Generating...' : 'Generate New Lifetime License'}
        </button>

        {generatedKey && (
          <div className="p-6 bg-zinc-50 rounded-lg border border-zinc-200 text-center">
            <p className="text-sm font-medium text-zinc-500 mb-2">New License Key</p>
            <div className="text-2xl font-mono font-bold tracking-widest text-zinc-900 mb-4 select-all">
              {generatedKey}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedKey);
                setCopied(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
