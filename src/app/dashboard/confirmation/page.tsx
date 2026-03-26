'use client';

import { useState } from 'react';
import { Phone, CheckCircle, XCircle, Clock, Ban, Copy, ArrowRight } from 'lucide-react';
import { cn, formatPrice, CONFIRMATION_STATUS_LABELS } from '@/lib/utils';

const ordersToConfirm = [
  {
    id: '1', shopifyOrderNumber: '#1250', customerName: 'Amine Bouzid', customerPhone: '0555112233',
    customerWilaya: 'Alger', customerAddress: 'Cité 500 logements, Bab Ezzouar',
    productName: 'Montre connectée', totalPrice: 8500, confirmationStatus: 'PENDING', attempts: 0,
  },
  {
    id: '2', shopifyOrderNumber: '#1251', customerName: 'Meriem Sahli', customerPhone: '0661445566',
    customerWilaya: 'Tizi Ouzou', customerAddress: 'Rue Abane Ramdane',
    productName: 'Sac à dos voyage', totalPrice: 3400, confirmationStatus: 'PENDING', attempts: 0,
  },
  {
    id: '3', shopifyOrderNumber: '#1252', customerName: 'Reda Hamidouche', customerPhone: '0770889900',
    customerWilaya: 'Sétif', customerAddress: 'Cité El Hidhab',
    productName: 'Kit maquillage pro', totalPrice: 4200, confirmationStatus: 'NO_ANSWER', attempts: 2,
  },
  {
    id: '4', shopifyOrderNumber: '#1253', customerName: 'Lina Messaoudi', customerPhone: '0555667788',
    customerWilaya: 'Annaba', customerAddress: 'Résidence Les Palmiers',
    productName: 'Parfum collection', totalPrice: 5600, confirmationStatus: 'POSTPONED', attempts: 1,
  },
];

export default function ConfirmationPage() {
  const [activeOrder, setActiveOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const filteredOrders = filter === 'all'
    ? ordersToConfirm
    : ordersToConfirm.filter((o) => o.confirmationStatus === filter);

  const handleConfirm = (orderId: string, status: string) => {
    console.log(`Order ${orderId} -> ${status}`);
    setActiveOrder(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Confirmation des commandes</h1>
        <p className="text-sm text-gray-500">Appelez les clients pour confirmer leurs commandes avant expédition</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { key: 'all', label: 'Total', count: 45, color: 'bg-gray-100 text-gray-700' },
          { key: 'PENDING', label: 'En attente', count: 28, color: 'bg-yellow-100 text-yellow-700' },
          { key: 'NO_ANSWER', label: 'Pas de réponse', count: 8, color: 'bg-gray-100 text-gray-700' },
          { key: 'POSTPONED', label: 'Reportées', count: 5, color: 'bg-blue-100 text-blue-700' },
          { key: 'CONFIRMED', label: 'Confirmées', count: 4, color: 'bg-green-100 text-green-700' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              'card text-center cursor-pointer transition-shadow hover:shadow-md',
              filter === item.key && 'ring-2 ring-primary-500'
            )}
          >
            <p className="text-2xl font-bold text-gray-900">{item.count}</p>
            <p className="text-xs text-gray-500">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filteredOrders.map((order) => {
          const confirmInfo = CONFIRMATION_STATUS_LABELS[order.confirmationStatus];
          return (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{order.shopifyOrderNumber}</span>
                    <span className={cn('badge', confirmInfo?.color)}>{confirmInfo?.fr}</span>
                    {order.attempts > 0 && (
                      <span className="text-xs text-gray-400">{order.attempts} tentative(s)</span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-500">Client</p>
                      <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-mono font-medium text-gray-900">{order.customerPhone}</p>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Wilaya</p>
                      <p className="text-sm text-gray-900">{order.customerWilaya}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Montant</p>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalPrice)}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {order.productName} · {order.customerAddress}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t pt-4">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="btn-primary text-xs py-1.5"
                >
                  <Phone className="mr-1 h-3.5 w-3.5" /> Appeler
                </a>
                <button
                  onClick={() => handleConfirm(order.id, 'CONFIRMED')}
                  className="btn-success text-xs py-1.5"
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" /> Confirmé
                </button>
                <button
                  onClick={() => handleConfirm(order.id, 'NO_ANSWER')}
                  className="btn-secondary text-xs py-1.5"
                >
                  <Phone className="mr-1 h-3.5 w-3.5" /> Pas de réponse
                </button>
                <button
                  onClick={() => handleConfirm(order.id, 'POSTPONED')}
                  className="btn-secondary text-xs py-1.5"
                >
                  <Clock className="mr-1 h-3.5 w-3.5" /> Reporter
                </button>
                <button
                  onClick={() => handleConfirm(order.id, 'CANCELLED')}
                  className="btn-danger text-xs py-1.5"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Annuler
                </button>
                <button
                  onClick={() => handleConfirm(order.id, 'DUPLICATE')}
                  className="btn-secondary text-xs py-1.5"
                >
                  <Ban className="mr-1 h-3.5 w-3.5" /> Doublon
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
