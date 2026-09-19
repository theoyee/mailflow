"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, PenSquare, MessageSquare, Users, Target, LayoutTemplate, Send, Clock, Settings, Server, Bot, Key, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLicense } from '@/lib/license';

const navItems = [
  { name: 'Inbox', href: '/', icon: Inbox },
  { name: 'Compose', href: '/compose', icon: PenSquare },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Templates', href: '/templates', icon: LayoutTemplate },
  { name: 'Sent', href: '/sent', icon: Send },
  { name: 'Scheduled', href: '/scheduled', icon: Clock },
];

const settingsItems = [
  { name: 'SMTP Accounts', href: '/settings/smtp', icon: Server },
  { name: 'AI Settings', href: '/settings/ai', icon: Bot },
  { name: 'License', href: '/settings/license', icon: Key },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isPro, license } = useLicense();

  return (
    <div className="w-64 bg-zinc-900 text-zinc-100 h-screen flex flex-col">
      <div className="p-4 flex items-center justify-between font-bold text-lg border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-400" />
          Mailflow
        </div>
        {isPro ? (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            PRO
          </span>
        ) : (
          <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            UNLICENSED
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          <div className="flex items-center justify-between px-2 mb-2 mt-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Mailbox</span>
            {!isPro && (
              <span className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            if (!isPro) {
              return (
                <Link
                  key={item.name}
                  href="/settings/license"
                  title="Active license required"
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors opacity-60 hover:opacity-100 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-zinc-500" />
                    <span>{item.name}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <nav className="space-y-1 px-2 mt-8">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">Configuration</div>
          {settingsItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* License Status Card in Sidebar Bottom */}
      <div className="p-3 border-t border-zinc-800">
        <Link
          href="/settings/license"
          className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors text-xs"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn("w-4 h-4", isPro ? "text-emerald-400" : "text-zinc-400")} />
            <div>
              <div className="font-semibold text-zinc-200">
                {isPro ? `${license?.type?.toUpperCase() || 'PRO'} License` : 'No License Active'}
              </div>
              <div className="text-[11px] text-zinc-400">
                {isPro ? 'All Features Unlocked' : 'Click to Activate'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
            {isPro ? 'ACTIVE' : 'KEY'}
          </span>
        </Link>
      </div>
    </div>
  );
}
