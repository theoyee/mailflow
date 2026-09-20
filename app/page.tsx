import { listAllEmails } from '@/src/db/mail-repo';
import { Inbox, Search, Mail, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const resolvedParams = await searchParams;
  const selectedId = resolvedParams?.id;

  // Safely fetch emails from Neon/SQLite database with fallback
  let allEmails: any[] = [];
  try {
    allEmails = await listAllEmails();
  } catch (err) {
    console.error('Failed to load emails for Inbox:', err);
    allEmails = [];
  }

  const selectedEmail = selectedId ? allEmails.find((e) => e.id === selectedId) : null;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-zinc-50 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-800">
          <Inbox className="w-5 h-5 text-zinc-500" />
          Message History
        </h1>
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-full bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Email List */}
        <div
          className={cn(
            "w-full md:w-[350px] lg:w-[400px] border-r flex flex-col bg-zinc-50 shrink-0 overflow-y-auto custom-scrollbar",
            selectedId ? "hidden md:flex" : "flex"
          )}
        >
          {allEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center space-y-3">
              <Mail className="w-10 h-10 text-zinc-300" />
              <p className="text-sm">No messages found. Send a campaign to see history.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {allEmails.map((email) => {
                const isSelected = email.id === selectedId;
                return (
                  <Link
                    href={`/?id=${email.id}`}
                    key={email.id}
                    className={cn(
                      "block p-4 transition-colors hover:bg-white cursor-pointer relative",
                      isSelected ? "bg-white border-l-2 border-l-blue-600 shadow-sm z-10" : "border-l-2 border-l-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm truncate text-zinc-900 pr-2">
                        To: {email.to}
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0 mt-0.5">
                        {email.createdAt ? new Date(email.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-zinc-700 truncate mb-1">
                      {email.subject}
                    </div>
                    <div className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {email.body}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Email Reader */}
        <div
          className={cn(
            "flex-1 bg-white flex flex-col overflow-hidden",
            !selectedId ? "hidden md:flex" : "flex"
          )}
        >
          {!selectedEmail ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <Mail className="w-12 h-12 text-zinc-200 mb-4" />
              <p>Select a message from the list to view it</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-6 md:p-10 border-b shrink-0 bg-white">
                <Link href="/" className="md:hidden inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 mb-6 bg-zinc-100 px-3 py-1.5 rounded-full transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to list
                </Link>
                <div className="flex justify-between items-start gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedEmail.createdAt ? new Date(selectedEmail.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    {selectedEmail.to.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-sm">
                    <span className="font-semibold text-zinc-900">
                      {selectedEmail.to}
                    </span>
                    <span className="text-zinc-500">
                      Status: <span className="capitalize text-zinc-700 font-medium">{selectedEmail.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10 text-zinc-800 text-sm leading-relaxed whitespace-pre-wrap bg-white">
                {selectedEmail.body}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}