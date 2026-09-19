"use client";
import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Save } from 'lucide-react';

export default function TemplatesPage() {
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
  const [isAdding, setIsAdding] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '' });

  function saveTemplate() {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) return;
    const updated = [...templates, { id: Date.now().toString(), ...newTemplate }];
    setTemplates(updated);
    localStorage.setItem('email_templates', JSON.stringify(updated));
    setIsAdding(false);
    setNewTemplate({ name: '', subject: '', body: '' });
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('email_templates', JSON.stringify(updated));
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-zinc-500" />
          Email Templates
        </h1>
        <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Create Template
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg border shadow-sm mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name</label>
            <input value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g., Q3 Follow Up" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject Line</label>
            <input value={newTemplate.subject} onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Hi {{FirstName}}..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Body</label>
            <textarea value={newTemplate.body} onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })} className="w-full border rounded-md px-3 py-2 text-sm h-32 resize-none" placeholder="Write your template here..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-md">Cancel</button>
            <button onClick={saveTemplate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Template
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 && !isAdding && (
          <div className="col-span-full bg-white p-12 rounded-lg border shadow-sm text-center text-zinc-500">
            No templates saved yet. Create one to use it in your bulk campaigns!
          </div>
        )}
        {templates.map(template => (
          <div key={template.id} className="bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-zinc-50 flex justify-between items-start">
              <h3 className="font-semibold text-zinc-900 truncate pr-4">{template.name}</h3>
              <button onClick={() => deleteTemplate(template.id)} className="text-zinc-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col text-sm">
              <div className="text-zinc-900 font-medium truncate mb-2">Subj: {template.subject}</div>
              <div className="text-zinc-500 line-clamp-4">{template.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}