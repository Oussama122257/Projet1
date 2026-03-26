import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CARRIER_INFO } from '@/lib/carriers';

export async function GET(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const configs = await prisma.carrierConfig.findMany({
    where: { shopId },
  });

  const carriers = Object.entries(CARRIER_INFO).map(([code, info]) => {
    const config = configs.find((c) => c.carrierCode === code);
    return {
      code,
      ...info,
      isConfigured: !!config,
      isActive: config?.isActive || false,
      isDefault: config?.isDefault || false,
    };
  });

  return NextResponse.json({ carriers });
}

export async function POST(req: NextRequest) {
  const shopId = req.headers.get('x-shop-id');
  if (!shopId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { carrierCode, apiKey, apiSecret, apiId, isDefault } = await req.json();

    if (!carrierCode || !apiKey) {
      return NextResponse.json({ error: 'carrierCode et apiKey requis' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.carrierConfig.updateMany({
        where: { shopId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const config = await prisma.carrierConfig.upsert({
      where: { shopId_carrierCode: { shopId, carrierCode } },
      update: { apiKey, apiSecret, apiId, isDefault: isDefault || false, isActive: true },
      create: { shopId, carrierCode, apiKey, apiSecret, apiId, isDefault: isDefault || false },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Carrier config error:', error);
    return NextResponse.json({ error: 'Erreur de configuration' }, { status: 500 });
  }
}
