"use client";
import { useState, useEffect } from 'react';
import { addContact, getContacts } from '@/app/actions';
import { Plus, Users, Search, Download, Trash2, Mail } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    getContacts().then(setContacts);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addContact({
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
      position: formData.get('position') as string,
    });
    setIsAdding(false);
    getContacts().then(setContacts);
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-zinc-500" /> Contacts
        </h1>
        <div className="flex gap-2">
          <button className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-md hover:bg-zinc-200 flex items-center gap-2 text-sm font-medium transition-colors border">
            <Download className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setIsAdding(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border shadow-sm mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">First Name</label><input name="firstName" required className="w-full border rounded-md px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Last Name</label><input name="lastName" required className="w-full border rounded-md px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Email Address</label><input name="email" type="email" required className="w-full border rounded-md px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Company</label><input name="company" className="w-full border rounded-md px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Position</label><input name="position" className="w-full border rounded-md px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-md">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">Save Contact</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-zinc-50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input type="text" placeholder="Search contacts..." className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="text-sm text-zinc-500">{contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}</div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 border-b sticky top-0">
              <tr>
                <th className="px-6 py-3 font-medium text-zinc-500">Name</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Email</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Company</th>
                <th className="px-6 py-3 font-medium text-zinc-500">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4 font-medium text-zinc-900">{contact.firstName} {contact.lastName}</td>
                  <td className="px-6 py-4 text-zinc-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-zinc-400" /> {contact.email}</td>
                  <td className="px-6 py-4 text-zinc-600">{contact.company || '-'}</td>
                  <td className="px-6 py-4 text-zinc-600">{contact.position || '-'}</td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No contacts found. Add some to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}