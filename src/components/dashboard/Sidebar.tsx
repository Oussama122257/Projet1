'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Truck,
  Send,
  BarChart3,
  Settings,
  MessageSquare,
  Users,
  FileText,
  Globe,
} from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Commandes', href: '/dashboard/orders', icon: Package },
  { name: 'Confirmation', href: '/dashboard/confirmation', icon: FileText },
  { name: 'Expédition', href: '/dashboard/dispatch', icon: Send },
  { name: 'Transporteurs', href: '/dashboard/carriers', icon: Truck },
  { name: 'Suivi', href: '/dashboard/tracking', icon: Globe },
  { name: 'Notifications', href: '/dashboard/notifications', icon: MessageSquare },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Équipe', href: '/dashboard/team', icon: Users },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-100">
        <Package className="h-8 w-8 text-primary-600" />
        <span className="text-lg font-bold text-gray-900">ColiShip DZ</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Plan info */}
      <div className="border-t border-gray-100 p-4">
        <div className="rounded-lg bg-primary-50 p-3">
          <p className="text-xs font-medium text-primary-700">Plan Gratuit</p>
          <p className="mt-1 text-xs text-primary-600">150/150 commandes ce mois</p>
          <Link href="/dashboard/settings" className="mt-2 block text-xs font-semibold text-primary-700 hover:text-primary-800">
            Mettre à niveau →
          </Link>
        </div>
      </div>
    </div>
  );
}
