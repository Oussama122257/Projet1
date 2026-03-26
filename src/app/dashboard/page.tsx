'use client';

import { useState } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import {
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn, formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils';

// Demo data - in production this would come from the API
const demoStats = {
  totalOrders: 1247,
  deliveredOrders: 892,
  returnedOrders: 134,
  pendingOrders: 89,
  inTransitOrders: 132,
  deliveryRate: 86.9,
  returnRate: 10.7,
  revenue: 3450000,
  codCollected: 2890000,
};

const recentOrders = [
  { id: '1', shopifyOrderNumber: '#1234', customerName: 'Ahmed Benali', customerWilaya: 'Alger', status: 'DELIVERED', totalPrice: 4500, createdAt: '2026-03-25T10:30:00Z' },
  { id: '2', shopifyOrderNumber: '#1235', customerName: 'Fatima Mansouri', customerWilaya: 'Oran', status: 'IN_TRANSIT', totalPrice: 3200, createdAt: '2026-03-25T11:00:00Z' },
  { id: '3', shopifyOrderNumber: '#1236', customerName: 'Karim Hadj', customerWilaya: 'Constantine', status: 'NEW', totalPrice: 5800, createdAt: '2026-03-25T12:15:00Z' },
  { id: '4', shopifyOrderNumber: '#1237', customerName: 'Sara Amrani', customerWilaya: 'Sétif', status: 'CONFIRMED', totalPrice: 2900, createdAt: '2026-03-25T13:45:00Z' },
  { id: '5', shopifyOrderNumber: '#1238', customerName: 'Mohamed Ziani', customerWilaya: 'Blida', status: 'OUT_FOR_DELIVERY', totalPrice: 6200, createdAt: '2026-03-25T14:20:00Z' },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500">Vue d&apos;ensemble de votre activité</p>
        </div>
        <div className="flex items-center gap-2">
          {['24h', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                period === p ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Commandes"
          value={demoStats.totalOrders.toLocaleString()}
          change="+12.5%"
          changeType="positive"
          icon={Package}
          iconColor="text-primary-600 bg-primary-100"
        />
        <StatsCard
          title="Livrées"
          value={demoStats.deliveredOrders.toLocaleString()}
          change={`${demoStats.deliveryRate}%`}
          changeType="positive"
          icon={CheckCircle}
          iconColor="text-green-600 bg-green-100"
        />
        <StatsCard
          title="Retournées"
          value={demoStats.returnedOrders.toLocaleString()}
          change={`${demoStats.returnRate}%`}
          changeType="negative"
          icon={RotateCcw}
          iconColor="text-red-600 bg-red-100"
        />
        <StatsCard
          title="Revenus"
          value={formatPrice(demoStats.revenue)}
          change="+8.3%"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-amber-600 bg-amber-100"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="En attente"
          value={demoStats.pendingOrders}
          icon={Clock}
          iconColor="text-yellow-600 bg-yellow-100"
        />
        <StatsCard
          title="En transit"
          value={demoStats.inTransitOrders}
          icon={Truck}
          iconColor="text-indigo-600 bg-indigo-100"
        />
        <StatsCard
          title="Taux de livraison"
          value={`${demoStats.deliveryRate}%`}
          icon={TrendingUp}
          iconColor="text-emerald-600 bg-emerald-100"
        />
        <StatsCard
          title="COD Collecté"
          value={formatPrice(demoStats.codCollected)}
          icon={DollarSign}
          iconColor="text-cyan-600 bg-cyan-100"
        />
      </div>

      {/* Recent Orders & Status Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Commandes récentes</h2>
            <a href="/dashboard/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Voir tout →
            </a>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const statusInfo = ORDER_STATUS_LABELS[order.status];
              return (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Package className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.shopifyOrderNumber} · {order.customerWilaya}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-900">{formatPrice(order.totalPrice)}</span>
                    <span className={cn('badge', statusInfo?.color)}>{statusInfo?.fr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <a href="/dashboard/orders?status=NEW" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Nouvelles commandes</p>
                <p className="text-xs text-gray-500">{demoStats.pendingOrders} en attente</p>
              </div>
            </a>
            <a href="/dashboard/confirmation" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Confirmer commandes</p>
                <p className="text-xs text-gray-500">À confirmer par téléphone</p>
              </div>
            </a>
            <a href="/dashboard/dispatch" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Expédier en masse</p>
                <p className="text-xs text-gray-500">Envoyer au transporteur</p>
              </div>
            </a>
            <a href="/dashboard/tracking" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Échecs de livraison</p>
                <p className="text-xs text-gray-500">Commandes à replanifier</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
