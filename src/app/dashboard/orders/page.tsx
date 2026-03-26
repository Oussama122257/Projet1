'use client';

import { useState } from 'react';
import OrderTable from '@/components/dashboard/OrderTable';
import {
  Plus,
  Download,
  Upload,
  Filter,
  Send,
  MessageSquare,
  CheckCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusTabs = [
  { key: 'all', label: 'Toutes', count: 247 },
  { key: 'NEW', label: 'Nouvelles', count: 45 },
  { key: 'CONFIRMED', label: 'Confirmées', count: 32 },
  { key: 'DISPATCHED', label: 'Expédiées', count: 28 },
  { key: 'IN_TRANSIT', label: 'En transit', count: 67 },
  { key: 'OUT_FOR_DELIVERY', label: 'En livraison', count: 18 },
  { key: 'DELIVERED', label: 'Livrées', count: 892 },
  { key: 'RETURNED', label: 'Retournées', count: 34 },
];

// Demo orders
const demoOrders = [
  {
    id: '1', shopifyOrderNumber: '#1234', customerName: 'Ahmed Benali', customerPhone: '0555123456',
    customerWilaya: 'Alger', productName: 'T-shirt Premium', totalPrice: 4500, isCOD: true,
    status: 'NEW', confirmationStatus: 'PENDING', carrierCode: undefined, carrierTrackingId: undefined,
    createdAt: '2026-03-25T10:30:00Z',
  },
  {
    id: '2', shopifyOrderNumber: '#1235', customerName: 'Fatima Mansouri', customerPhone: '0661234567',
    customerWilaya: 'Oran', productName: 'Robe d\'été', totalPrice: 3200, isCOD: true,
    status: 'CONFIRMED', confirmationStatus: 'CONFIRMED', carrierCode: undefined, carrierTrackingId: undefined,
    createdAt: '2026-03-25T11:00:00Z',
  },
  {
    id: '3', shopifyOrderNumber: '#1236', customerName: 'Karim Hadj', customerPhone: '0770345678',
    customerWilaya: 'Constantine', productName: 'Sneakers Sport', totalPrice: 5800, isCOD: true,
    status: 'DISPATCHED', confirmationStatus: 'CONFIRMED', carrierCode: 'YALIDINE', carrierTrackingId: 'YAL-2026032501',
    createdAt: '2026-03-25T12:15:00Z',
  },
  {
    id: '4', shopifyOrderNumber: '#1237', customerName: 'Sara Amrani', customerPhone: '0555987654',
    customerWilaya: 'Sétif', productName: 'Sac à main cuir', totalPrice: 2900, isCOD: true,
    status: 'IN_TRANSIT', confirmationStatus: 'CONFIRMED', carrierCode: 'ZR_EXPRESS', carrierTrackingId: 'ZR-123456',
    createdAt: '2026-03-25T13:45:00Z',
  },
  {
    id: '5', shopifyOrderNumber: '#1238', customerName: 'Mohamed Ziani', customerPhone: '0661456789',
    customerWilaya: 'Blida', productName: 'Montre classique', totalPrice: 6200, isCOD: true,
    status: 'DELIVERED', confirmationStatus: 'CONFIRMED', carrierCode: 'MAYSTRO', carrierTrackingId: 'MST-789012',
    createdAt: '2026-03-25T14:20:00Z',
  },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const filteredOrders = activeTab === 'all'
    ? demoOrders
    : demoOrders.filter((o) => o.status === activeTab);

  const handleSelectOrder = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500">Gérez toutes vos commandes</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary text-sm">
            <Upload className="mr-2 h-4 w-4" /> Importer CSV
          </button>
          <button className="btn-secondary text-sm">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </button>
          <button onClick={() => setShowNewOrder(true)} className="btn-primary text-sm">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle commande
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-primary-50 border border-primary-200 px-4 py-3">
          <span className="text-sm font-medium text-primary-700">
            {selectedOrders.length} commande(s) sélectionnée(s)
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-primary text-xs py-1.5">
              <CheckCircle className="mr-1 h-3.5 w-3.5" /> Confirmer
            </button>
            <button className="btn-primary text-xs py-1.5 bg-purple-600 hover:bg-purple-700">
              <Send className="mr-1 h-3.5 w-3.5" /> Expédier
            </button>
            <button className="btn-primary text-xs py-1.5 bg-green-600 hover:bg-green-700">
              <MessageSquare className="mr-1 h-3.5 w-3.5" /> Envoyer SMS
            </button>
            <button onClick={() => setSelectedOrders([])} className="rounded p-1.5 text-primary-600 hover:bg-primary-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            )}
          >
            {tab.label}
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs',
              activeTab === tab.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, numéro de commande..."
            className="input"
          />
        </div>
        <button className="btn-secondary text-sm">
          <Filter className="mr-2 h-4 w-4" /> Filtres
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <OrderTable
          orders={filteredOrders}
          selectedOrders={selectedOrders}
          onSelectOrder={handleSelectOrder}
          onSelectAll={handleSelectAll}
          onViewOrder={(id) => console.log('View order:', id)}
        />
      </div>

      {/* New Order Modal */}
      {showNewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle commande</h2>
              <button onClick={() => setShowNewOrder(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom du client *</label>
                  <input type="text" className="input mt-1" placeholder="Ahmed Benali" required />
                </div>
                <div>
                  <label className="label">Téléphone *</label>
                  <input type="tel" className="input mt-1" placeholder="0555123456" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Wilaya *</label>
                  <select className="input mt-1" required>
                    <option value="">Sélectionner...</option>
                    <option>Alger</option><option>Oran</option><option>Constantine</option>
                    <option>Blida</option><option>Sétif</option><option>Tizi Ouzou</option>
                    <option>Béjaïa</option><option>Annaba</option><option>Batna</option>
                  </select>
                </div>
                <div>
                  <label className="label">Commune *</label>
                  <input type="text" className="input mt-1" placeholder="Bab El Oued" required />
                </div>
              </div>
              <div>
                <label className="label">Adresse *</label>
                <input type="text" className="input mt-1" placeholder="Rue, quartier, cité..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Produit *</label>
                  <input type="text" className="input mt-1" placeholder="Nom du produit" required />
                </div>
                <div>
                  <label className="label">Quantité</label>
                  <input type="number" className="input mt-1" defaultValue={1} min={1} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prix total (DA) *</label>
                  <input type="number" className="input mt-1" placeholder="4500" required />
                </div>
                <div>
                  <label className="label">Type de paiement</label>
                  <select className="input mt-1">
                    <option value="cod">Paiement à la livraison (COD)</option>
                    <option value="paid">Déjà payé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Note</label>
                <textarea className="input mt-1" rows={2} placeholder="Instructions spéciales..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowNewOrder(false)} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer la commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
