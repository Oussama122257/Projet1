'use client';

import { useState } from 'react';
import { Search, Truck, Package, MapPin, CheckCircle, RotateCcw, AlertTriangle, ExternalLink } from 'lucide-react';
import { cn, ORDER_STATUS_LABELS, formatDate } from '@/lib/utils';

const trackingOrders = [
  { id: '1', trackingId: 'YAL-2026032501', carrier: 'YALIDINE', customerName: 'Karim Hadj', wilaya: 'Constantine', status: 'IN_TRANSIT', lastUpdate: '2026-03-25T08:30:00Z' },
  { id: '2', trackingId: 'ZR-123456', carrier: 'ZR_EXPRESS', customerName: 'Sara Amrani', wilaya: 'Sétif', status: 'OUT_FOR_DELIVERY', lastUpdate: '2026-03-25T10:15:00Z' },
  { id: '3', trackingId: 'MST-789012', carrier: 'MAYSTRO', customerName: 'Mohamed Ziani', wilaya: 'Blida', status: 'DELIVERED', lastUpdate: '2026-03-25T14:20:00Z' },
  { id: '4', trackingId: 'YAL-2026032502', carrier: 'YALIDINE', customerName: 'Amira Belkacem', wilaya: 'Alger', status: 'AT_WILAYA', lastUpdate: '2026-03-25T07:00:00Z' },
  { id: '5', trackingId: 'ZR-654321', carrier: 'ZR_EXPRESS', customerName: 'Nabil Brahimi', wilaya: 'Oran', status: 'FAILED_DELIVERY', lastUpdate: '2026-03-25T16:00:00Z' },
  { id: '6', trackingId: 'YAL-2026032503', carrier: 'YALIDINE', customerName: 'Lina Messaoudi', wilaya: 'Annaba', status: 'RETURNED', lastUpdate: '2026-03-24T12:00:00Z' },
];

const statusFilters = [
  { key: 'all', label: 'Tous', icon: Package },
  { key: 'IN_TRANSIT', label: 'En transit', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'En livraison', icon: MapPin },
  { key: 'DELIVERED', label: 'Livrés', icon: CheckCircle },
  { key: 'FAILED_DELIVERY', label: 'Échec', icon: AlertTriangle },
  { key: 'RETURNED', label: 'Retournés', icon: RotateCcw },
];

export default function TrackingDashboard() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredOrders = trackingOrders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.trackingId.toLowerCase().includes(search.toLowerCase()) &&
        !o.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi des colis</h1>
        <p className="text-sm text-gray-500">Suivez tous vos colis expédiés en temps réel</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setFilter(sf.key)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              filter === sf.key ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm ring-1 ring-gray-200'
            )}
          >
            <sf.icon className="h-4 w-4" />
            {sf.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par tracking ID ou nom..."
          className="input pl-9"
        />
      </div>

      {/* Orders grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => {
          const statusInfo = ORDER_STATUS_LABELS[order.status];
          return (
            <div key={order.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">{order.carrier}</span>
                </div>
                <span className={cn('badge', statusInfo?.color)}>{statusInfo?.fr}</span>
              </div>
              <div className="mt-3">
                <p className="font-mono text-sm font-bold text-gray-900">{order.trackingId}</p>
                <p className="mt-1 text-sm text-gray-600">{order.customerName}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {order.wilaya}
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Dernière MAJ: {formatDate(order.lastUpdate)}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <a
                  href={`/track/${order.trackingId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs flex-1 py-1.5"
                >
                  <ExternalLink className="mr-1 h-3.5 w-3.5" /> Page de suivi
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="card text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Aucun colis trouvé</p>
        </div>
      )}
    </div>
  );
}
