"use client";
import { useState, useEffect } from 'react';
import { getContacts, getSmtpAccounts } from '@/app/actions';
import { Send, Sparkles, X, Paperclip, Loader2, FileText } from 'lucide-react';

export default function ComposePage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('email_templates');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  const [subject, setSubject] = useState('');
  const [to, setTo] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [body, setBody] = useState('');
  const [accountId, setAccountId] = useState('');

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Concise');

  useEffect(() => {
    getSmtpAccounts().then(data => {
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
    });
    getContacts().then(setContacts);
  }, []);

  async function generateAiContent() {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, tone, length })
      });
      const data = await res.json();
      if (data.text) {
        setBody((prev) => prev ? `${prev}\n\n${data.text}` : data.text);
        setShowAiModal(false);
        setAiPrompt('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  }

  function selectContact(contact: any) {
    setTo(contact.email);
    setContactSearch(contact.email);
    setShowContactDropdown(false);

    // Automatically replace existing placeholders in subject and body
    let newSubject = subject;
    let newBody = body;

    const vars = [
      { t: '{{FirstName}}', v: contact.firstName || '' },
      { t: '{{LastName}}', v: contact.lastName || '' },
      { t: '{{FullName}}', v: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() },
      { t: '{{Email}}', v: contact.email || '' },
      { t: '{{Company}}', v: contact.company || '' },
      { t: '{{Position}}', v: contact.position || '' },
    ];

    vars.forEach(v => {
      newSubject = newSubject.replaceAll(v.t, v.v);
      newBody = newBody.replaceAll(v.t, v.v);
    });

    setSubject(newSubject);
    setBody(newBody);
  }

  function handleInsertVariable(variable: string) {
    const matchedContact = to ? contacts.find(c => c.email.toLowerCase() === to.toLowerCase().trim()) : null;
    let valueToInsert = variable;

    if (matchedContact) {
      if (variable === '{{FirstName}}') valueToInsert = matchedContact.firstName || '';
      else if (variable === '{{LastName}}') valueToInsert = matchedContact.lastName || '';
      else if (variable === '{{FullName}}') valueToInsert = `${matchedContact.firstName || ''} ${matchedContact.lastName || ''}`.trim();
      else if (variable === '{{Email}}') valueToInsert = matchedContact.email || '';
      else if (variable === '{{Company}}') valueToInsert = matchedContact.company || '';
      else if (variable === '{{Position}}') valueToInsert = matchedContact.position || '';
    }

    setBody(prev => {
      const needsSpace = prev.length > 0 && !prev.endsWith(' ') && !prev.endsWith('\n');
      return prev + (needsSpace ? ' ' : '') + valueToInsert;
    });
  }

  function loadTemplate(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const t = templates.find(x => x.id === id);
    if (t) {
      setSubject(t.subject);
      setBody(t.body);

      // If a contact is already selected, immediately personalize the template!
      const matchedContact = to ? contacts.find(c => c.email.toLowerCase() === to.toLowerCase().trim()) : null;
      if (matchedContact) {
        let newSubject = t.subject;
        let newBody = t.body;

        const vars = [
          { t: '{{FirstName}}', v: matchedContact.firstName || '' },
          { t: '{{LastName}}', v: matchedContact.lastName || '' },
          { t: '{{FullName}}', v: `${matchedContact.firstName || ''} ${matchedContact.lastName || ''}`.trim() },
          { t: '{{Email}}', v: matchedContact.email || '' },
          { t: '{{Company}}', v: matchedContact.company || '' },
          { t: '{{Position}}', v: matchedContact.position || '' },
        ];

        vars.forEach(v => {
          newSubject = newSubject.replaceAll(v.t, v.v);
          newBody = newBody.replaceAll(v.t, v.v);
        });

        setSubject(newSubject);
        setBody(newBody);
      }
    }
    e.target.value = ""; // Reset dropdown
  }

  async function handleSend() {
    if (!accountId || !to || !subject || !body) {
      alert('Please fill out all fields (Account, To, Subject, Body)');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, to, subject, body }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('Email sent successfully!');
        setTo('');
        setContactSearch('');
        setSubject('');
        setBody('');
      } else {
        alert('Failed to send email: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Failed to send email: ' + e.message);
    } finally {
      setIsSending(false);
    }
  }

  const filteredContacts = contacts.filter(c =>
    c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.firstName && c.firstName.toLowerCase().includes(contactSearch.toLowerCase())) ||
    (c.lastName && c.lastName.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Send className="w-6 h-6 text-zinc-500" />
          Compose
        </h1>
        <button onClick={() => setShowAiModal(true)} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors border border-purple-200">
          <Sparkles className="w-4 h-4" /> AI Assistant
        </button>
      </div>
      <div className="flex-1 flex flex-col bg-white rounded-lg border shadow-sm overflow-visible">
        <div className="border-b p-4 flex flex-col gap-4 bg-zinc-50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-500 w-16">From:</label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="flex-1 bg-white border rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            >
              {accounts.length === 0 && <option value="">No SMTP accounts configured</option>}
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.user})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-500 w-16">To:</label>
            <div className="relative flex-1">
              <input
                type="text"
                value={contactSearch}
                onChange={e => {
                  setContactSearch(e.target.value);
                  setTo(e.target.value);
                  setShowContactDropdown(true);
                }}
                onFocus={() => setShowContactDropdown(true)}
                onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
                className="w-full bg-white border rounded-md px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                placeholder="Search contacts or type an email address..."
              />
              {showContactDropdown && filteredContacts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto border-zinc-200">
                  {filteredContacts.map(c => (
                    <div
                      key={c.id}
                      className="px-3 py-2 text-sm hover:bg-zinc-50 cursor-pointer flex justify-between items-center border-b last:border-b-0 border-zinc-100"
                      onClick={() => selectContact(c)}
                    >
                      <span className="font-medium text-zinc-900">{c.firstName} {c.lastName}</span>
                      <span className="text-zinc-500 text-xs">{c.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-500 w-16">Subject:</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="flex-1 bg-white border rounded-md px-3 py-1.5 text-sm font-semibold outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div className="p-2 border-b bg-zinc-50 flex justify-between items-center overflow-x-auto text-xs">
          <div className="flex gap-2 items-center">
            <span className="text-zinc-500 py-1 px-2 font-medium">Insert Variables:</span>
            {['{{FirstName}}', '{{LastName}}', '{{FullName}}', '{{Email}}', '{{Company}}', '{{Position}}'].map(v => (
              <button key={v} onClick={() => handleInsertVariable(v)} className="bg-white border px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                {v}
              </button>
            ))}
          </div>
          {templates.length > 0 && (
            <div className="flex items-center gap-2 pr-2">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <select
                onChange={loadTemplate}
                className="bg-white border rounded-md px-2 py-1 outline-none focus:border-blue-500 text-zinc-700 cursor-pointer"
              >
                <option value="">Load Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <textarea
          className="flex-1 p-6 text-sm resize-none outline-none leading-relaxed"
          placeholder="Write your email here, or use the AI Assistant to draft it..."
          value={body}
          onChange={e => setBody(e.target.value)}
        />

        <div className="p-4 border-t bg-zinc-50 flex justify-between items-center rounded-b-lg">
          <button className="text-zinc-500 hover:text-zinc-700 p-2 rounded-md hover:bg-zinc-200 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 rounded-md transition-colors">
              Save Draft
            </button>
            <button
              onClick={handleSend}
              disabled={isSending}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSending ? 'Sending...' : 'Send Now'}
            </button>
          </div>
        </div>
      </div>

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-zinc-50">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-600" /> Generate with AI</h2>
              <button onClick={() => setShowAiModal(false)} className="text-zinc-400 hover:text-zinc-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">What should the email be about?</label>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="w-full border rounded-md p-3 text-sm h-24 outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="e.g. Follow up on yesterday's meeting about the Q3 roadmap..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tone</label>
                  <select value={tone} onChange={e => setTone(e.target.value)} className="w-full border rounded-md p-2 text-sm">
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Persuasive</option>
                    <option>Direct</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Length</label>
                  <select value={length} onChange={e => setLength(e.target.value)} className="w-full border rounded-md p-2 text-sm">
                    <option>Concise</option>
                    <option>Standard</option>
                    <option>Detailed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-zinc-50 flex justify-end gap-2">
              <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-200 rounded-md">Cancel</button>
              <button
                onClick={generateAiContent}
                disabled={isAiLoading || !aiPrompt}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}