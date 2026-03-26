import { CarrierDriver } from './types';
import { YalidineCarrier } from './yalidine';
import { ZRExpressCarrier } from './zr-express';
import { MaystroCarrier } from './maystro';
import { ProcolisCarrier } from './procolis';
import { DHDCarrier } from './dhd';
import { NoestCarrier } from './noest';
import { EcotrackCarrier } from './ecotrack';

export type { CarrierDriver, CarrierOrder, CarrierResponse, TrackingInfo, TrackingEvent, CarrierPricing } from './types';

export type CarrierCode = 'YALIDINE' | 'ZR_EXPRESS' | 'MAYSTRO' | 'PROCOLIS' | 'DHD' | 'NOEST' | 'ECOTRACK';

export const CARRIER_INFO: Record<CarrierCode, { name: string; logo: string; website: string; features: string[] }> = {
  YALIDINE: {
    name: 'Yalidine Express',
    logo: '/carriers/yalidine.png',
    website: 'https://yalidine.com',
    features: ['58 wilayas', 'Livraison J+1', 'COD', 'API complète', 'Stop-desk'],
  },
  ZR_EXPRESS: {
    name: 'ZR Express',
    logo: '/carriers/zr-express.png',
    website: 'https://zrexpress.com',
    features: ['National', 'Express', 'COD', 'Suivi temps réel'],
  },
  MAYSTRO: {
    name: 'Maystro Delivery',
    logo: '/carriers/maystro.png',
    website: 'https://maystro-delivery.com',
    features: ['National', 'API REST', 'COD', 'Bulk envoi'],
  },
  PROCOLIS: {
    name: 'Procolis',
    logo: '/carriers/procolis.png',
    website: 'https://procolis.com',
    features: ['National', 'COD', 'Suivi', 'Retour automatique'],
  },
  DHD: {
    name: 'DHD Livraison Express',
    logo: '/carriers/dhd.png',
    website: 'https://dhd.dz',
    features: ['55 wilayas', 'Express', 'COD', 'Stockage'],
  },
  NOEST: {
    name: 'Noest Express',
    logo: '/carriers/noest.png',
    website: 'https://noest.dz',
    features: ['National', 'B2B & B2C', 'COD', 'Suivi temps réel'],
  },
  ECOTRACK: {
    name: 'EcoTrack',
    logo: '/carriers/ecotrack.png',
    website: 'https://ecotrack.dz',
    features: ['Multi-transporteur', 'Agrégateur', 'COD', 'Tableau de bord'],
  },
};

export function createCarrierDriver(
  carrierCode: CarrierCode,
  config: { apiKey: string; apiSecret?: string; apiId?: string }
): CarrierDriver {
  switch (carrierCode) {
    case 'YALIDINE':
      return new YalidineCarrier(config.apiId || '', config.apiKey);
    case 'ZR_EXPRESS':
      return new ZRExpressCarrier(config.apiKey);
    case 'MAYSTRO':
      return new MaystroCarrier(config.apiKey);
    case 'PROCOLIS':
      return new ProcolisCarrier(config.apiKey);
    case 'DHD':
      return new DHDCarrier(config.apiKey);
    case 'NOEST':
      return new NoestCarrier(config.apiKey);
    case 'ECOTRACK':
      return new EcotrackCarrier(config.apiKey);
    default:
      throw new Error(`Unsupported carrier: ${carrierCode}`);
  }
}
