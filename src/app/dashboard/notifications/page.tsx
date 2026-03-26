'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Send, Check, X } from 'lucide-react';
import { cn, ORDER_STATUS_LABELS } from '@/lib/utils';

const templates = [
  {
    id: '1', trigger: 'CONFIRMED', channel: 'SMS', isActive: true,
    messageFr: 'Bonjour {{customer_name}}, votre commande #{{order_number}} a été confirmée. Livraison sous 2-3 jours. Suivi: {{tracking_url}}',
  },
  {
    id: '2', trigger: 'DISPATCHED', channel: 'SMS', isActive: true,
    messageFr: 'Votre colis #{{order_number}} a été expédié via {{carrier_name}}. Suivi: {{tracking_url}}',
  },
  {
    id: '3', trigger: 'OUT_FOR_DELIVERY', channel: 'SMS', isActive: true,
    messageFr: 'Votre colis #{{order_number}} est en cours de livraison. Le livreur vous contactera bientôt.',
  },
  {
    id: '4', trigger: 'DELIVERED', channel: 'SMS', isActive: true,
    messageFr: 'Votre commande #{{order_number}} a été livrée avec succès. Merci pour votre achat !',
  },
  {
    id: '5', trigger: 'RETURNED', channel: 'SMS', isActive: false,
    messageFr: 'Votre colis #{{order_number}} n\'a pas pu être livré. Contactez-nous pour plus d\'informations.',
  },
];

const smsStats = {
  sent: 2457,
  delivered: 2389,
  failed: 68,
  credits: 542,
};

const variables = [
  { key: '{{customer_name}}', desc: 'Nom du client' },
  { key: '{{order_number}}', desc: 'Numéro de commande' },
  { key: '{{tracking_url}}', desc: 'Lien de suivi' },
  { key: '{{carrier_name}}', desc: 'Nom du transporteur' },
  { key: '{{wilaya}}', desc: 'Wilaya du client' },
  { key: '{{product_name}}', desc: 'Nom du produit' },
  { key: '{{total_price}}', desc: 'Prix total' },
  { key: '{{shop_name}}', desc: 'Nom de la boutique' },
];

export default function NotificationsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications SMS</h1>
          <p className="text-sm text-gray-500">Configurez les messages automatiques envoyés à vos clients</p>
        </div>
        <button className="btn-primary text-sm">
          <Plus className="mr-2 h-4 w-4" /> Nouveau modèle
        </button>
      </div>

      {/* SMS Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{smsStats.sent.toLocaleString()}</p>
          <p className="text-sm text-gray-500">SMS envoyés</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">{smsStats.delivered.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Délivrés</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">{smsStats.failed}</p>
          <p className="text-sm text-gray-500">Échoués</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{smsStats.credits}</p>
          <p className="text-sm text-gray-500">Crédits restants</p>
        </div>
      </div>

      {/* Templates */}
      <div className="space-y-4">
        {templates.map((template) => {
          const statusInfo = ORDER_STATUS_LABELS[template.trigger];
          return (
            <div key={template.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn('badge', statusInfo?.color)}>{statusInfo?.fr}</span>
                      <span className="badge bg-gray-100 text-gray-600">{template.channel}</span>
                      <span className={cn('badge', template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {template.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 max-w-2xl">{template.messageFr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(template.id)}
                    className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Variables reference */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Variables disponibles</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {variables.map((v) => (
            <div key={v.key} className="rounded-lg bg-gray-50 p-3">
              <code className="text-xs font-mono text-primary-600">{v.key}</code>
              <p className="text-xs text-gray-500 mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
