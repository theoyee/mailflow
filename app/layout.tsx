import type {Metadata} from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'NexusMail AI - Desktop Email Sender',
  description: 'Production-ready AI-powered desktop email sender.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
