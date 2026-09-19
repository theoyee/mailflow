"use client";
import { useState, useEffect } from 'react';
import { addSmtpAccount, getSmtpAccounts } from '@/app/actions';
import { Plus, Server, Trash2, CheckCircle2 } from 'lucide-react';

export default function SmtpSettingsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    getSmtpAccounts().then(setAccounts);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addSmtpAccount({
      name: formData.get('name') as string,
      host: formData.get('host') as string,
      port: parseInt(formData.get('port') as string, 10),
      secure: formData.get('secure') === 'on',
      user: formData.get('user') as string,
      pass: formData.get('pass') as string, // Sent to electron IPC securely in reality
    });
    setIsAdding(false);
    getSmtpAccounts().then(setAccounts);
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Server className="w-6 h-6 text-zinc-500" />
          SMTP Accounts
        </h1>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border shadow-sm mb-6 space-y-4">
          <h2 className="text-lg font-semibold">New SMTP Configuration</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Account Name</label>
              <input name="name" required className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Work Email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Host</label>
              <input name="host" required className="w-full border rounded-md px-3 py-2 text-sm" placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Port</label>
              <input name="port" type="number" required className="w-full border rounded-md px-3 py-2 text-sm" placeholder="465" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Username / Email</label>
              <input name="user" type="email" required className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password / App Password</label>
              <input name="pass" type="password" required className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-2 mt-7">
              <input name="secure" type="checkbox" id="secure" className="rounded text-blue-600" defaultChecked />
              <label htmlFor="secure" className="text-sm font-medium">Use SSL/TLS</label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-md">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Save Account</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white border rounded-lg p-5 shadow-sm relative group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{acc.name}</h3>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-sm text-zinc-500 space-y-1">
              <p><span className="font-medium">User:</span> {acc.user}</p>
              <p><span className="font-medium">Host:</span> {acc.host}:{acc.port}</p>
              <p><span className="font-medium">Security:</span> {acc.secure ? 'SSL/TLS' : 'STARTTLS'}</p>
            </div>
            <button className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {accounts.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-white rounded-lg border border-dashed">
            No SMTP accounts configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
