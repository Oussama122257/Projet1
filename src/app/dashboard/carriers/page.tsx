'use client';

import { useState } from 'react';
import { Truck, Check, Settings, ExternalLink, Shield, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const carriers = [
  {
    code: 'YALIDINE', name: 'Yalidine Express', website: 'yalidine.com',
    features: ['58 wilayas', 'J+1', 'COD', 'Stop-desk', 'API REST'],
    isConfigured: true, isActive: true, isDefault: true,
  },
  {
    code: 'ZR_EXPRESS', name: 'ZR Express', website: 'zrexpress.com',
    features: ['National', 'Express', 'COD', 'Suivi temps réel'],
    isConfigured: true, isActive: true, isDefault: false,
  },
  {
    code: 'MAYSTRO', name: 'Maystro Delivery', website: 'maystro-delivery.com',
    features: ['National', 'API REST', 'COD', 'Bulk envoi'],
    isConfigured: false, isActive: false, isDefault: false,
  },
  {
    code: 'PROCOLIS', name: 'Procolis', website: 'procolis.com',
    features: ['National', 'COD', 'Suivi', 'Retour auto'],
    isConfigured: false, isActive: false, isDefault: false,
  },
  {
    code: 'DHD', name: 'DHD Livraison Express', website: 'dhd.dz',
    features: ['55 wilayas', 'Express', 'COD', 'Stockage'],
    isConfigured: false, isActive: false, isDefault: false,
  },
  {
    code: 'NOEST', name: 'Noest Express', website: 'noest.dz',
    features: ['National', 'B2B & B2C', 'COD', 'Suivi'],
    isConfigured: false, isActive: false, isDefault: false,
  },
  {
    code: 'ECOTRACK', name: 'EcoTrack', website: 'ecotrack.dz',
    features: ['Multi-transporteur', 'Agrégateur', 'COD'],
    isConfigured: false, isActive: false, isDefault: false,
  },
];

export default function CarriersPage() {
  const [configuring, setConfiguring] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transporteurs</h1>
        <p className="text-sm text-gray-500">
          Configurez vos clés API pour connecter les transporteurs algériens
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {carriers.map((carrier) => (
          <div
            key={carrier.code}
            className={cn(
              'card relative hover:shadow-md transition-shadow',
              carrier.isDefault && 'ring-2 ring-primary-500'
            )}
          >
            {carrier.isDefault && (
              <div className="absolute -top-2.5 right-4">
                <span className="badge bg-primary-600 text-white text-xs">Par défaut</span>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-lg',
                  carrier.isActive ? 'bg-primary-100' : 'bg-gray-100'
                )}>
                  <Truck className={cn('h-6 w-6', carrier.isActive ? 'text-primary-600' : 'text-gray-400')} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{carrier.name}</h3>
                  <p className="text-xs text-gray-500">{carrier.website}</p>
                </div>
              </div>
              {carrier.isConfigured && (
                <span className={cn(
                  'badge',
                  carrier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {carrier.isActive ? 'Actif' : 'Inactif'}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {carrier.features.map((feature) => (
                <span key={feature} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {feature}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              {carrier.isConfigured ? (
                <>
                  <button
                    onClick={() => setConfiguring(carrier.code)}
                    className="btn-secondary text-xs flex-1"
                  >
                    <Settings className="mr-1 h-3.5 w-3.5" /> Configurer
                  </button>
                  <a href={`https://${carrier.website}`} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </>
              ) : (
                <button
                  onClick={() => setConfiguring(carrier.code)}
                  className="btn-primary text-xs flex-1"
                >
                  <Zap className="mr-1 h-3.5 w-3.5" /> Connecter
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Configurer {carriers.find((c) => c.code === configuring)?.name}
              </h2>
              <button onClick={() => setConfiguring(null)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="label">Clé API *</label>
                <input type="text" className="input mt-1" placeholder="Votre clé API" required />
              </div>
              {configuring === 'YALIDINE' && (
                <div>
                  <label className="label">API ID *</label>
                  <input type="text" className="input mt-1" placeholder="Votre API ID Yalidine" required />
                </div>
              )}
              <div>
                <label className="label">Secret API</label>
                <input type="password" className="input mt-1" placeholder="Secret (optionnel)" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isDefault" className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                <label htmlFor="isDefault" className="text-sm text-gray-700">Définir comme transporteur par défaut</label>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 flex items-start gap-2">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Vos clés API sont chiffrées et stockées en toute sécurité. Nous ne les partageons jamais.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setConfiguring(null)} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  <Check className="mr-2 h-4 w-4" /> Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
