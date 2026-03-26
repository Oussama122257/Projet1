'use client';

import { useState } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  DollarSign,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';

const periods = [
  { key: '24h', label: '24 heures' },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
];

const carrierPerformance = [
  { name: 'Yalidine', orders: 456, delivered: 398, returned: 32, rate: 87.3 },
  { name: 'ZR Express', orders: 312, delivered: 267, returned: 28, rate: 85.6 },
  { name: 'Maystro', orders: 189, delivered: 170, returned: 11, rate: 89.9 },
  { name: 'Procolis', orders: 145, delivered: 121, returned: 15, rate: 83.4 },
];

const wilayaPerformance = [
  { wilaya: 'Alger', orders: 312, rate: 92.3 },
  { wilaya: 'Oran', orders: 187, rate: 88.7 },
  { wilaya: 'Constantine', orders: 134, rate: 85.1 },
  { wilaya: 'Blida', orders: 98, rate: 90.2 },
  { wilaya: 'Sétif', orders: 87, rate: 82.5 },
  { wilaya: 'Tizi Ouzou', orders: 76, rate: 84.2 },
  { wilaya: 'Béjaïa', orders: 65, rate: 81.3 },
  { wilaya: 'Annaba', orders: 54, rate: 86.8 },
];

const dailyData = [
  { date: 'Lun', orders: 45, delivered: 38, returned: 4 },
  { date: 'Mar', orders: 52, delivered: 44, returned: 5 },
  { date: 'Mer', orders: 49, delivered: 41, returned: 3 },
  { date: 'Jeu', orders: 63, delivered: 55, returned: 6 },
  { date: 'Ven', orders: 38, delivered: 32, returned: 2 },
  { date: 'Sam', orders: 71, delivered: 62, returned: 5 },
  { date: 'Dim', orders: 29, delivered: 25, returned: 2 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('7d');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Performances et statistiques détaillées</p>
        </div>
        <div className="flex items-center gap-2">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                period === p.key ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Commandes totales" value="1,247" change="+12.5%" changeType="positive" icon={Package} />
        <StatsCard title="Taux de livraison" value="86.9%" change="+2.3%" changeType="positive" icon={TrendingUp} iconColor="text-green-600 bg-green-100" />
        <StatsCard title="Taux de retour" value="10.7%" change="-1.2%" changeType="positive" icon={TrendingDown} iconColor="text-red-600 bg-red-100" />
        <StatsCard title="Revenu COD" value={formatPrice(3450000)} change="+8.3%" changeType="positive" icon={DollarSign} iconColor="text-amber-600 bg-amber-100" />
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily orders chart (simplified as table) */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commandes par jour</h2>
          <div className="space-y-3">
            {dailyData.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="w-10 text-sm font-medium text-gray-500">{day.date}</span>
                <div className="flex-1">
                  <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
                    <div
                      className="bg-green-500 rounded-l-full"
                      style={{ width: `${(day.delivered / day.orders) * 100}%` }}
                    />
                    <div
                      className="bg-red-400"
                      style={{ width: `${(day.returned / day.orders) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{day.orders}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-6 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Livrées
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Retournées
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-200" /> Autres
            </span>
          </div>
        </div>

        {/* Carrier performance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par transporteur</h2>
          <div className="space-y-4">
            {carrierPerformance.map((carrier) => (
              <div key={carrier.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Truck className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{carrier.name}</p>
                    <p className="text-xs text-gray-500">{carrier.orders} commandes</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{carrier.rate}%</span>
                    <CheckCircle className={cn(
                      'h-4 w-4',
                      carrier.rate >= 85 ? 'text-green-500' : 'text-amber-500'
                    )} />
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="text-green-600">{carrier.delivered}</span> /
                    <span className="text-red-500 ml-1">{carrier.returned}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wilaya performance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par wilaya</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {wilayaPerformance.map((w) => (
            <div key={w.wilaya} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{w.wilaya}</p>
                <p className="text-xs text-gray-500">{w.orders} commandes</p>
              </div>
              <span className={cn(
                'badge',
                w.rate >= 90 ? 'bg-green-100 text-green-700' :
                w.rate >= 85 ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              )}>
                {w.rate}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
