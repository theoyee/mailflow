"use client";
import { useState, useEffect } from 'react';
import { getContacts, getSmtpAccounts } from '@/app/actions';
import { Target, Play, Pause, ListChecks, CheckCircle2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CampaignsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [accountId, setAccountId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('idle');

  useEffect(() => {
    getContacts().then(setContacts);
    getSmtpAccounts().then(data => {
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
    });
    const savedTemplates = localStorage.getItem('email_templates');
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates));
  }, []);

  function loadTemplate(id: string) {
    const t = templates.find(x => x.id === id);
    if (t) {
      setSubject(t.subject);
      setBody(t.body);
    }
  }

  async function startCampaign() {
    if (!accountId || contacts.length === 0 || !subject || !body) return;

    setSending(true);
    setStatus('running');
    setProgress(0);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      let personalizedSubject = subject.replace('{{FirstName}}', contact.firstName || '').replace('{{LastName}}', contact.lastName || '').replace('{{Company}}', contact.company || '');
      let personalizedBody = body.replace('{{FirstName}}', contact.firstName || '').replace('{{LastName}}', contact.lastName || '').replace('{{Company}}', contact.company || '');

      try {
        await fetch('/api/campaigns/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId, to: contact.email, subject: personalizedSubject, body: personalizedBody })
        });
      } catch (err) {
        console.error('Failed to send to', contact.email);
      }
      setProgress(Math.round(((i + 1) / contacts.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    }

    setSending(false);
    setStatus('completed');
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-zinc-500" /> Bulk Campaigns
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        <div className="flex flex-col bg-white rounded-lg border shadow-sm p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 border-b pb-4">Campaign Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select SMTP Account</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-white border rounded-md p-2 text-sm">
                {accounts.length === 0 && <option value="">No accounts setup</option>}
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.user})</option>)}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Recipients</label>
                <div className="text-sm border rounded-md p-2 bg-zinc-50 flex items-center gap-2 text-zinc-600">
                  <ListChecks className="w-4 h-4 text-blue-500" /> Sending to {contacts.length} contacts
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1 flex items-center gap-1"><FileText className="w-4 h-4" /> Load Template</label>
                <select onChange={e => loadTemplate(e.target.value)} className="w-full bg-white border rounded-md p-2 text-sm">
                  <option value="">-- Choose Template --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border rounded-md p-2 text-sm" placeholder="Hi {{FirstName}}..." />
            </div>

            <div className="flex-1 min-h-[250px] flex flex-col">
              <label className="block text-sm font-medium mb-1">Message Body</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} className="flex-1 w-full border rounded-md p-3 text-sm resize-none" placeholder="Use {{FirstName}}, {{LastName}}, {{Company}}..." />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 border-b pb-4">Execution Controls</h2>
            <div className="flex items-center gap-4 mb-6">
              <button onClick={startCampaign} disabled={sending || status === 'completed'} className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Start Campaign
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-zinc-500">Progress</span>
                <span className={cn(status === 'completed' ? "text-green-600" : "text-blue-600")}>{progress}%</span>
              </div>
              <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                <div className={cn("h-2.5 transition-all duration-300", status === 'completed' ? 'bg-green-500' : 'bg-blue-600')} style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}