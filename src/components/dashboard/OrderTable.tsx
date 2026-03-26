'use client';

import { cn, formatPrice, formatDate, ORDER_STATUS_LABELS, CONFIRMATION_STATUS_LABELS } from '@/lib/utils';
import { Eye, MoreVertical, Send, MessageSquare, Printer } from 'lucide-react';

interface Order {
  id: string;
  shopifyOrderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  productName: string;
  totalPrice: number;
  isCOD: boolean;
  status: string;
  confirmationStatus: string;
  carrierCode?: string;
  carrierTrackingId?: string;
  createdAt: string;
  assignedAgent?: { name: string };
}

interface OrderTableProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectOrder: (id: string) => void;
  onSelectAll: () => void;
  onViewOrder: (id: string) => void;
}

export default function OrderTable({
  orders,
  selectedOrders,
  onSelectOrder,
  onSelectAll,
  onViewOrder,
}: OrderTableProps) {
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
            </th>
            <th className="table-header">N° Commande</th>
            <th className="table-header">Client</th>
            <th className="table-header">Produit</th>
            <th className="table-header">Wilaya</th>
            <th className="table-header">Prix</th>
            <th className="table-header">Confirmation</th>
            <th className="table-header">Statut</th>
            <th className="table-header">Transporteur</th>
            <th className="table-header">Date</th>
            <th className="table-header">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {orders.map((order) => {
            const statusInfo = ORDER_STATUS_LABELS[order.status] || { fr: order.status, color: 'bg-gray-100 text-gray-800' };
            const confirmInfo = CONFIRMATION_STATUS_LABELS[order.confirmationStatus] || { fr: order.confirmationStatus, color: 'bg-gray-100 text-gray-800' };

            return (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-3 py-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => onSelectOrder(order.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                </td>
                <td className="table-cell font-medium text-gray-900">
                  {order.shopifyOrderNumber || order.id.slice(-8)}
                </td>
                <td className="table-cell">
                  <div>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                  </div>
                </td>
                <td className="table-cell max-w-[200px] truncate">{order.productName}</td>
                <td className="table-cell">{order.customerWilaya}</td>
                <td className="table-cell font-medium">
                  {formatPrice(order.totalPrice)}
                  {order.isCOD && <span className="ml-1 text-xs text-amber-600">COD</span>}
                </td>
                <td className="table-cell">
                  <span className={cn('badge', confirmInfo.color)}>{confirmInfo.fr}</span>
                </td>
                <td className="table-cell">
                  <span className={cn('badge', statusInfo.color)}>{statusInfo.fr}</span>
                </td>
                <td className="table-cell">
                  {order.carrierCode ? (
                    <div>
                      <p className="text-xs font-medium">{order.carrierCode}</p>
                      {order.carrierTrackingId && (
                        <p className="text-xs text-gray-400">{order.carrierTrackingId}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="table-cell text-xs">{formatDate(order.createdAt)}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewOrder(order.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Envoyer SMS">
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Imprimer étiquette">
                      <Printer className="h-4 w-4" />
                    </button>
                    <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {orders.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gray-500">Aucune commande trouvée</p>
        </div>
      )}
    </div>
  );
}
