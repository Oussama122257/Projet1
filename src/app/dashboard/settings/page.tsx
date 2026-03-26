'use client';

import { useState } from 'react';
import { Save, Globe, CreditCard, Shield, Key, Store, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');

  const sections = [
    { key: 'general', label: 'Général', icon: Store },
    { key: 'billing', label: 'Facturation', icon: CreditCard },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'api', label: 'API & Webhooks', icon: Key },
    { key: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500">Configurez votre compte et vos préférences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeSection === section.key
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <section.icon className="h-5 w-5" />
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'general' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom de la boutique</label>
                  <input type="text" className="input mt-1" defaultValue="Ma Boutique DZ" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input mt-1" defaultValue="contact@maboutique.dz" />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input type="tel" className="input mt-1" defaultValue="0555123456" />
                </div>
                <div>
                  <label className="label">Langue</label>
                  <select className="input mt-1">
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="label">Devise</label>
                  <select className="input mt-1">
                    <option value="DZD">Dinar Algérien (DZD)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Fuseau horaire</label>
                  <select className="input mt-1">
                    <option value="Africa/Algiers">Alger (GMT+1)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button className="btn-primary">
                  <Save className="mr-2 h-4 w-4" /> Sauvegarder
                </button>
              </div>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">API & Webhooks</h2>
              <div>
                <label className="label">URL du Webhook (transporteurs)</label>
                <div className="mt-1 flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                    POST
                  </span>
                  <input
                    type="text"
                    className="input rounded-l-none"
                    readOnly
                    defaultValue="https://votre-app.vercel.app/api/webhooks/carrier"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Configurez cette URL dans le dashboard de votre transporteur pour recevoir les mises à jour de statut.
                </p>
              </div>
              <div>
                <label className="label">Secret du Webhook</label>
                <input type="password" className="input mt-1" defaultValue="whsec_xxxxxxxxxxxx" readOnly />
                <p className="mt-1 text-xs text-gray-500">
                  Ajoutez ce secret dans le header <code className="bg-gray-100 px-1 rounded">x-webhook-secret</code> de vos requêtes.
                </p>
              </div>
              <div>
                <label className="label">Domaine Shopify connecté</label>
                <input type="text" className="input mt-1" readOnly defaultValue="ma-boutique.myshopify.com" />
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Webhooks Shopify actifs
                </h3>
                <ul className="mt-2 space-y-1 text-xs text-blue-600">
                  <li>orders/create</li>
                  <li>orders/updated</li>
                  <li>orders/cancelled</li>
                  <li>orders/fulfilled</li>
                  <li>app/uninstalled</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Facturation & Plan</h2>
              <div className="rounded-lg border-2 border-primary-200 bg-primary-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-primary-900">Plan Gratuit</h3>
                    <p className="text-sm text-primary-700">150 commandes/mois · 1 boutique · 1 transporteur</p>
                  </div>
                  <button className="btn-primary text-sm">Mettre à niveau</button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-gray-600">Commandes ce mois</span>
                  <span className="text-sm font-medium text-gray-900">87 / 150</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-gray-600">Crédits SMS</span>
                  <span className="text-sm font-medium text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">Prochain renouvellement</span>
                  <span className="text-sm font-medium text-gray-900">01/04/2026</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
