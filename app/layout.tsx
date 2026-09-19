import type {Metadata} from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { LicenseGate } from '@/components/LicenseGate';

export const metadata: Metadata = {
  title: 'Mailflow',
  description: 'AI-powered email campaign and communication manager with templates and SMTP integration.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 h-full overflow-y-auto">
          <LicenseGate>
            {children}
          </LicenseGate>
        </main>
      </body>
    </html>
  );
}
