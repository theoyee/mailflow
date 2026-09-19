import { sqliteDb } from '@/src/db/sqlite';
import { emails } from '@/src/db/sqlite-schema';
import { desc } from 'drizzle-orm';

// This forces Next.js to fetch fresh data every time you load the page
export const dynamic = 'force-dynamic';

export default async function Sent() {
  // Fetch all emails from your local SQLite database, newest first
  const sentEmails = await sqliteDb.select().from(emails).orderBy(desc(emails.createdAt));

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sent Emails</h1>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden flex-1 flex flex-col">
        {sentEmails.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 mt-10">
            No sent emails found. Head over to the Compose tab to send your first email!
          </div>
        ) : (
          <div className="overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-zinc-500 w-1/4">To</th>
                  <th className="p-4 font-medium text-zinc-500 w-1/2">Subject</th>
                  <th className="p-4 font-medium text-zinc-500 w-32">Status</th>
                  <th className="p-4 font-medium text-zinc-500">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sentEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-4 truncate">{email.to}</td>
                    <td className="p-4 font-medium truncate">{email.subject}</td>
                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                        {email.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500 whitespace-nowrap">
                      {email.createdAt ? new Date(email.createdAt).toLocaleString() : 'Unknown'}
                    </td>
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