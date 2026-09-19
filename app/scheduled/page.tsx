import { sqliteDb } from '@/src/db/sqlite';
import { emails } from '@/src/db/sqlite-schema';
import { eq, desc } from 'drizzle-orm';
import { CalendarClock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ScheduledPage() {
  const scheduledEmails = await sqliteDb.select().from(emails).where(eq(emails.status, 'scheduled')).orderBy(desc(emails.createdAt));

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <CalendarClock className="w-6 h-6 text-zinc-500" />
        Scheduled Emails
      </h1>

      <div className="bg-white rounded-lg border shadow-sm flex-1 overflow-hidden flex flex-col">
        {scheduledEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center space-y-3">
            <CalendarClock className="w-12 h-12 text-zinc-300" />
            <p className="text-sm">No emails are currently scheduled to be sent.</p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-zinc-500">To</th>
                  <th className="p-4 font-medium text-zinc-500">Subject</th>
                  <th className="p-4 font-medium text-zinc-500">Scheduled For</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {scheduledEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-zinc-50">
                    <td className="p-4">{email.to}</td>
                    <td className="p-4 font-medium">{email.subject}</td>
                    <td className="p-4 text-zinc-500">{email.scheduledAt ? new Date(email.scheduledAt).toLocaleString() : 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}