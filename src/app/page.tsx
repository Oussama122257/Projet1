'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  BarChart3,
  MessageSquare,
  Globe,
  Shield,
  ArrowRight,
  Check,
  Star,
  Zap,
  ShoppingBag,
  ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: ShoppingBag,
    title: 'Intégration Shopify',
    description: 'Synchronisation automatique des commandes depuis votre boutique Shopify. Installation en un clic.',
  },
  {
    icon: Truck,
    title: 'Multi-Transporteurs',
    description: 'Yalidine, ZR Express, Maystro, Procolis, DHD, Noest et plus. Tous connectés via API.',
  },
  {
    icon: Package,
    title: 'Gestion COD',
    description: 'Suivi complet du Cash on Delivery. Confirmation, expédition et collecte des paiements.',
  },
  {
    icon: MessageSquare,
    title: 'SMS Automatiques',
    description: 'Notifications SMS automatiques à chaque étape. Réduisez les échecs de livraison de 50%.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avancés',
    description: 'Tableau de bord en temps réel : taux de livraison, revenus, performance par transporteur.',
  },
  {
    icon: Globe,
    title: 'Suivi en Temps Réel',
    description: 'Page de suivi personnalisée pour vos clients. Liens de tracking automatiques.',
  },
];

const carriers = [
  'Yalidine Express', 'ZR Express', 'Maystro Delivery', 'Procolis',
  'DHD Express', 'Noest Express', 'EcoTrack', 'Guepex',
];

const plans = [
  {
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    orders: '150 commandes/mois',
    features: ['1 boutique', '1 transporteur', 'Suivi basique', 'Support email'],
    cta: 'Commencer gratuitement',
    popular: false,
  },
  {
    name: 'Starter',
    price: '2,900',
    period: ' DA/mois',
    orders: '1,000 commandes/mois',
    features: ['2 boutiques', 'Tous les transporteurs', '500 SMS inclus', 'Envoi en masse', 'Support prioritaire'],
    cta: 'Essai gratuit 14 jours',
    popular: false,
  },
  {
    name: 'Growth',
    price: '7,900',
    period: ' DA/mois',
    orders: '5,000 commandes/mois',
    features: ['5 boutiques', 'Tous les transporteurs', '2,000 SMS inclus', 'API complète', 'Équipe (5 membres)', 'WhatsApp notifications', 'Analytics avancés'],
    cta: 'Essai gratuit 14 jours',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '14,900',
    period: ' DA/mois',
    orders: 'Commandes illimitées',
    features: ['Boutiques illimitées', 'Tous les transporteurs', 'SMS illimités', 'API complète', 'Équipe illimitée', 'Manager dédié', 'SLA garanti', 'Sender ID personnalisé'],
    cta: 'Contacter les ventes',
    popular: false,
  },
];

const stats = [
  { value: '10,000+', label: 'Commandes traitées' },
  { value: '500+', label: 'Boutiques actives' },
  { value: '98%', label: 'Taux de livraison' },
  { value: '7', label: 'Transporteurs intégrés' },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('monthly');

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Package className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">ColiShip DZ</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Fonctionnalités</a>
            <a href="#carriers" className="text-sm text-gray-600 hover:text-gray-900">Transporteurs</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Connexion
            </Link>
            <Link href="/auth/install" className="btn-primary text-sm">
              Installer sur Shopify
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50/50 to-white" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm text-primary-700 mb-8">
            <Zap className="h-4 w-4" />
            Plateforme #1 de livraison e-commerce en Algérie
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto">
            Gérez vos livraisons Shopify en{' '}
            <span className="text-primary-600">Algérie</span>{' '}
            en toute simplicité
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Connectez votre boutique Shopify à tous les transporteurs algériens.
            Automatisez la confirmation, l&apos;expédition et le suivi de vos commandes COD.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/auth/install" className="btn-primary text-base px-8 py-3">
              Commencer gratuitement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="#features" className="btn-secondary text-base px-8 py-3">
              Voir la démo
            </Link>
          </div>
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Tout ce dont vous avez besoin</h2>
            <p className="mt-4 text-lg text-gray-600">Une plateforme complète pour gérer vos livraisons e-commerce en Algérie</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="card hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carriers */}
      <section id="carriers" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Transporteurs Intégrés</h2>
          <p className="mt-4 text-lg text-gray-600">Connectez-vous à tous les transporteurs algériens en un clic</p>
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {carriers.map((carrier) => (
              <div key={carrier} className="card flex items-center justify-center py-8 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <Truck className="h-10 w-10 text-primary-500 mx-auto mb-3" />
                  <span className="text-sm font-medium text-gray-700">{carrier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Comment ça marche</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Installez l\'app', desc: 'Connectez votre boutique Shopify en un clic' },
              { step: '2', title: 'Configurez', desc: 'Ajoutez vos clés API transporteurs et modèles SMS' },
              { step: '3', title: 'Confirmez', desc: 'Confirmez vos commandes et expédiez en masse' },
              { step: '4', title: 'Suivez', desc: 'Suivez en temps réel et notifiez vos clients' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Tarifs simples et transparents</h2>
            <p className="mt-4 text-lg text-gray-600">Choisissez le plan qui correspond à votre activité</p>
            <div className="mt-6 inline-flex rounded-lg bg-gray-100 p-1">
              <button
                className={`rounded-md px-4 py-2 text-sm font-medium ${activeTab === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab('monthly')}
              >
                Mensuel
              </button>
              <button
                className={`rounded-md px-4 py-2 text-sm font-medium ${activeTab === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab('yearly')}
              >
                Annuel (-20%)
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card relative ${plan.popular ? 'ring-2 ring-primary-600 shadow-lg' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                      <Star className="h-3 w-3" /> Populaire
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">{plan.orders}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary-600 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`mt-8 w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary-600">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="h-12 w-12 text-primary-200 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white">Prêt à optimiser vos livraisons ?</h2>
          <p className="mt-4 text-lg text-primary-100">
            Rejoignez des centaines de boutiques algériennes qui utilisent ColiShip DZ.
          </p>
          <Link href="/auth/install" className="mt-8 inline-flex items-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary-600 hover:bg-primary-50 transition-colors">
            Installer sur Shopify gratuitement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary-600" />
              <span className="font-bold text-gray-900">ColiShip DZ</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} ColiShip DZ. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
