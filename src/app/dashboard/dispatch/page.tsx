'use client';

import { useState } from 'react';
import { Send, Truck, Package, AlertCircle, CheckCircle, Printer, Download } from 'lucide-react';
import { cn, formatPrice, ORDER_STATUS_LABELS } from '@/lib/utils';

const confirmedOrders = [
  { id: '1', shopifyOrderNumber: '#1235', customerName: 'Fatima Mansouri', customerWilaya: 'Oran', customerCommune: 'Oran Centre', totalPrice: 3200, isCOD: true, productName: 'Robe d\'été' },
  { id: '2', shopifyOrderNumber: '#1240', customerName: 'Youcef Kara', customerWilaya: 'Constantine', customerCommune: 'El Khroub', totalPrice: 4100, isCOD: true, productName: 'Veste sport' },
  { id: '3', shopifyOrderNumber: '#1241', customerName: 'Amira Belkacem', customerWilaya: 'Alger', customerCommune: 'Bab El Oued', totalPrice: 2700, isCOD: true, productName: 'Écharpe soie' },
  { id: '4', shopifyOrderNumber: '#1242', customerName: 'Nabil Brahimi', customerWilaya: 'Blida', customerCommune: 'Blida Centre', totalPrice: 5500, isCOD: true, productName: 'Chaussures cuir' },
];

const carriers = [
  { code: 'YALIDINE', name: 'Yalidine Express', isActive: true },
  { code: 'ZR_EXPRESS', name: 'ZR Express', isActive: true },
  { code: 'MAYSTRO', name: 'Maystro Delivery', isActive: false },
];

export default function DispatchPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState('YALIDINE');
  const [dispatching, setDispatching] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const handleSelectOrder = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === confirmedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(confirmedOrders.map((o) => o.id));
    }
  };

  const handleDispatch = () => {
    setDispatching(true);
    setTimeout(() => {
      setResults({ success: selectedOrders.length, failed: 0 });
      setDispatching(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expédition en masse</h1>
        <p className="text-sm text-gray-500">Envoyez vos commandes confirmées au transporteur</p>
      </div>

      {results && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Expédition terminée : {results.success} commande(s) envoyée(s)
            </p>
            {results.failed > 0 && (
              <p className="text-xs text-red-600">{results.failed} échec(s)</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Orders to dispatch */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Commandes confirmées ({confirmedOrders.length})
            </h2>
            <button onClick={handleSelectAll} className="text-sm text-primary-600 hover:text-primary-700">
              {selectedOrders.length === confirmedOrders.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          <div className="space-y-3">
            {confirmedOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleSelectOrder(order.id)}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors',
                  selectedOrders.includes(order.id)
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-100 hover:bg-gray-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => handleSelectOrder(order.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    <span className="text-sm font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{order.shopifyOrderNumber}</span>
                    <span className="text-xs text-gray-500">{order.customerWilaya} - {order.customerCommune}</span>
                    <span className="text-xs text-gray-500">{order.productName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch panel */}
        <div className="card h-fit sticky top-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expédier</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Transporteur</label>
              <div className="mt-2 space-y-2">
                {carriers.filter((c) => c.isActive).map((carrier) => (
                  <label
                    key={carrier.code}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      selectedCarrier === carrier.code
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="carrier"
                      value={carrier.code}
                      checked={selectedCarrier === carrier.code}
                      onChange={(e) => setSelectedCarrier(e.target.value)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <Truck className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{carrier.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Commandes sélectionnées</span>
                <span className="font-bold text-gray-900">{selectedOrders.length}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Total COD</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(
                    confirmedOrders
                      .filter((o) => selectedOrders.includes(o.id))
                      .reduce((sum, o) => sum + o.totalPrice, 0)
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={handleDispatch}
              disabled={selectedOrders.length === 0 || dispatching}
              className="btn-primary w-full"
            >
              {dispatching ? (
                <>Expédition en cours...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Expédier {selectedOrders.length} commande(s)
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-xs">
                <Printer className="mr-1 h-3.5 w-3.5" /> Étiquettes
              </button>
              <button className="btn-secondary flex-1 text-xs">
                <Download className="mr-1 h-3.5 w-3.5" /> Bordereau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
