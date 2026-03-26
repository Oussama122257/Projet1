'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, MapPin, CheckCircle, Clock, RotateCcw, Phone, ArrowRight } from 'lucide-react';
import { cn, ORDER_STATUS_LABELS, formatDate } from '@/lib/utils';

interface TrackingData {
  orderId: string;
  trackingId: string;
  status: string;
  carrierCode: string;
  customerName: string;
  customerWilaya: string;
  productName: string;
  createdAt: string;
  estimatedDelivery: string | null;
  deliveredAt: string | null;
  history: Array<{ status: string; note: string; createdAt: string }>;
  shopName: string;
}

const TRACKING_STEPS = [
  { status: 'NEW', icon: Package, label: 'Commande reçue' },
  { status: 'CONFIRMED', icon: CheckCircle, label: 'Confirmée' },
  { status: 'DISPATCHED', icon: Truck, label: 'Expédiée' },
  { status: 'IN_TRANSIT', icon: Truck, label: 'En transit' },
  { status: 'AT_WILAYA', icon: MapPin, label: 'Au centre' },
  { status: 'OUT_FOR_DELIVERY', icon: Truck, label: 'En livraison' },
  { status: 'DELIVERED', icon: CheckCircle, label: 'Livrée' },
];

const STATUS_ORDER = ['NEW', 'CONFIRMED', 'DISPATCHED', 'IN_TRANSIT', 'AT_WILAYA', 'OUT_FOR_DELIVERY', 'DELIVERED'];

// Demo tracking data
const demoTracking: TrackingData = {
  orderId: 'demo-123',
  trackingId: 'YAL-2026032501',
  status: 'IN_TRANSIT',
  carrierCode: 'YALIDINE',
  customerName: 'Ahmed B.',
  customerWilaya: 'Oran',
  productName: 'T-shirt Premium Collection',
  createdAt: '2026-03-23T10:30:00Z',
  estimatedDelivery: '2026-03-27T18:00:00Z',
  deliveredAt: null,
  history: [
    { status: 'NEW', note: 'Commande reçue', createdAt: '2026-03-23T10:30:00Z' },
    { status: 'CONFIRMED', note: 'Commande confirmée par téléphone', createdAt: '2026-03-23T14:00:00Z' },
    { status: 'DISPATCHED', note: 'Expédiée via Yalidine Express', createdAt: '2026-03-24T09:00:00Z' },
    { status: 'IN_TRANSIT', note: 'En route vers Oran', createdAt: '2026-03-25T08:30:00Z' },
  ],
  shopName: 'Ma Boutique DZ',
};

export default function TrackingPage({ params }: { params: { trackingId: string } }) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTracking() {
      try {
        const res = await fetch(`/api/tracking/${params.trackingId}`);
        if (res.ok) {
          const data = await res.json();
          setTracking(data.tracking);
        } else {
          setTracking(demoTracking);
        }
      } catch {
        setTracking(demoTracking);
      } finally {
        setLoading(false);
      }
    }
    fetchTracking();
  }, [params.trackingId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          <p className="mt-4 text-gray-500">Chargement du suivi...</p>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="mx-auto h-16 w-16 text-gray-300" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Colis introuvable</h1>
          <p className="mt-2 text-gray-500">Vérifiez votre numéro de suivi et réessayez.</p>
        </div>
      </div>
    );
  }

  const isReturned = tracking.status === 'RETURNED';
  const isCancelled = tracking.status === 'CANCELLED';
  const currentStepIndex = STATUS_ORDER.indexOf(tracking.status);
  const statusInfo = ORDER_STATUS_LABELS[tracking.status];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary-600" />
            <span className="font-bold text-gray-900">{tracking.shopName}</span>
          </div>
          <span className="text-sm text-gray-500">Suivi de colis</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Status card */}
        <div className="card mb-8">
          <div className="text-center">
            <span className={cn('badge text-sm px-4 py-1.5', statusInfo?.color)}>
              {statusInfo?.fr}
            </span>
            <h1 className="mt-4 text-xl font-bold text-gray-900">{tracking.productName}</h1>
            <p className="mt-1 text-gray-500">
              Tracking: <span className="font-mono font-medium">{tracking.trackingId}</span>
            </p>
            {tracking.carrierCode && (
              <p className="mt-1 text-sm text-gray-500">
                Transporteur: <span className="font-medium">{tracking.carrierCode}</span>
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center border-t pt-6">
            <div>
              <Clock className="mx-auto h-5 w-5 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Commandé le</p>
              <p className="text-sm font-medium">{formatDate(tracking.createdAt)}</p>
            </div>
            <div>
              <MapPin className="mx-auto h-5 w-5 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Destination</p>
              <p className="text-sm font-medium">{tracking.customerWilaya}</p>
            </div>
            <div>
              <Truck className="mx-auto h-5 w-5 text-gray-400 mb-1" />
              <p className="text-xs text-gray-500">Livraison estimée</p>
              <p className="text-sm font-medium">
                {tracking.estimatedDelivery ? formatDate(tracking.estimatedDelivery) : '2-3 jours'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {!isReturned && !isCancelled && (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Progression</h2>
            <div className="relative">
              {TRACKING_STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.status} className="flex items-start gap-4 pb-8 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                        isCompleted
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-gray-200 bg-white text-gray-400'
                      )}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      {index < TRACKING_STEPS.length - 1 && (
                        <div className={cn(
                          'absolute top-10 h-8 w-0.5',
                          index < currentStepIndex ? 'bg-primary-600' : 'bg-gray-200'
                        )} />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className={cn(
                        'text-sm font-medium',
                        isCompleted ? 'text-gray-900' : 'text-gray-400'
                      )}>
                        {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-primary-600 mt-0.5">En cours</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique</h2>
          <div className="space-y-4">
            {tracking.history.map((event, index) => {
              const eventStatus = ORDER_STATUS_LABELS[event.status];
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.note}</p>
                    <p className="text-xs text-gray-500">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Propulsé par <span className="font-semibold text-primary-600">ColiShip DZ</span>
          </p>
        </div>
      </div>
    </div>
  );
}
