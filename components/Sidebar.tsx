"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, PenSquare, MessageSquare, Users, Target, LayoutTemplate, Send, Clock, Settings, Server, Bot, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  return (
    <div className="w-64 bg-zinc-900 text-zinc-100 h-screen flex flex-col">
      <div className="p-4 flex items-center gap-2 font-bold text-lg border-b border-zinc-800">
        <Send className="w-5 h-5 text-blue-400" />
        NexusMail AI
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2 mt-2">Mailbox</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                )}>
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <nav className="space-y-1 px-2 mt-8">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-2">Configuration</div>
          {settingsItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                )}>
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
