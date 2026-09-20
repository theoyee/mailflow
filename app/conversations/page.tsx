import { listAllEmails } from '@/src/db/mail-repo';
import { MessageSquare, Search, User, Clock, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Conversations({ searchParams }: { searchParams: Promise<{ contact?: string }> }) {
  const resolvedParams = await searchParams;
  const selectedContact = resolvedParams?.contact;

  // Safely fetch all emails from the database, newest first
  let allEmails: any[] = [];
  try {
    allEmails = await listAllEmails();
  } catch (err) {
    console.error('Failed to load emails for conversations:', err);
    allEmails = [];
  }

  // Group emails by recipient ('to' address) to form "threads"
  const threadsMap = new Map<string, typeof allEmails>();
  allEmails.forEach(email => {
    if (!threadsMap.has(email.to)) {
      threadsMap.set(email.to, []);
    }
    threadsMap.get(email.to)!.push(email);
  });

  // Map the groups into an array, reverse messages for chronological viewing, and sort threads by latest activity
  const threads = Array.from(threadsMap.entries()).map(([contact, msgs]) => {
    const latestMessage = msgs[0]; // SQL query was descending, so [0] is the newest
    const chronologicalMessages = [...msgs].reverse(); // Reverse so we can read top-to-bottom
    return {
      contact,
      latestMessage,
      messages: chronologicalMessages
    };
  }).sort((a, b) => {
    const timeA = a.latestMessage.createdAt ? new Date(a.latestMessage.createdAt).getTime() : 0;
    const timeB = b.latestMessage.createdAt ? new Date(b.latestMessage.createdAt).getTime() : 0;
    return timeB - timeA; // Put the most recently active threads at the top of the list
  });

  const activeThread = selectedContact ? threads.find(t => t.contact === selectedContact) : null;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-zinc-50 shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-800">
          <MessageSquare className="w-5 h-5 text-zinc-500" />
          Conversations
        </h1>
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-full bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Thread List */}
        <div
          className={cn(
            "w-full md:w-[350px] lg:w-[400px] border-r flex flex-col bg-zinc-50 shrink-0 overflow-y-auto custom-scrollbar",
            selectedContact ? "hidden md:flex" : "flex"
          )}
        >
          {threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-zinc-300" />
              <p className="text-sm">No conversations yet. Send some emails to build history.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {threads.map((thread) => {
                const isSelected = thread.contact === selectedContact;
                return (
                  <Link
                    href={`/conversations?contact=${encodeURIComponent(thread.contact)}`}
                    key={thread.contact}
                    className={cn(
                      "block p-4 transition-colors hover:bg-white cursor-pointer relative",
                      isSelected ? "bg-white border-l-2 border-l-purple-600 shadow-sm z-10" : "border-l-2 border-l-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                        {thread.contact.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-sm truncate text-zinc-900 pr-2">
                            {thread.contact}
                          </span>
                          <span className="text-xs text-zinc-400 shrink-0">
                            {thread.latestMessage.createdAt ? new Date(thread.latestMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Send className="w-3 h-3" /> {thread.messages.length} sent
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-zinc-700 truncate mb-1">
                      {thread.latestMessage.subject}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Thread History */}
        <div
          className={cn(
            "flex-1 bg-zinc-50/50 flex flex-col overflow-hidden",
            !selectedContact ? "hidden md:flex" : "flex"
          )}
        >
          {!activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
              <User className="w-12 h-12 text-zinc-200 mb-4" />
              <p>Select a contact to view your communication history</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="p-4 md:p-6 border-b shrink-0 bg-white shadow-sm z-10">
                <Link href="/conversations" className="md:hidden inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-800 mb-4 bg-zinc-100 px-3 py-1.5 rounded-full transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to contacts
                </Link>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    {activeThread.contact.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 tracking-tight leading-tight">
                      {activeThread.contact}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {activeThread.messages.length} {activeThread.messages.length === 1 ? 'message' : 'messages'} sent in this thread
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {activeThread.messages.map((msg, index) => (
                  <div key={msg.id} className="flex flex-col relative">
                    {/* Connecting line between messages if not the last one */}
                    {index !== activeThread.messages.length - 1 && (
                      <div className="absolute left-6 top-14 bottom-[-1.5rem] w-0.5 bg-zinc-200 z-0 hidden md:block"></div>
                    )}

                    <div className="flex gap-4 z-10 relative">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border-4 border-zinc-50/50 hidden md:flex">
                        <Send className="w-5 h-5 ml-0.5" />
                      </div>

                      <div className="flex-1 bg-white rounded-2xl rounded-tl-sm border shadow-sm overflow-hidden">
                        <div className="bg-zinc-50/80 border-b px-5 py-3 flex justify-between items-center">
                          <span className="font-semibold text-zinc-900 text-sm">{msg.subject}</span>
                          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                            <Clock className="w-3.5 h-3.5" />
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}
                          </div>
                        </div>
                        <div className="p-5 text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </div>
                        <div className="px-5 py-3 bg-zinc-50/50 border-t flex justify-end">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold capitalize">
                            {msg.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}