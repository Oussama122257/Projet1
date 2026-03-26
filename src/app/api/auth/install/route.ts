import { NextRequest, NextResponse } from 'next/server';
import { getInstallUrl } from '@/lib/shopify/config';
import { verifyShopDomain } from '@/lib/shopify/auth';

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get('shop');

  if (!shop || !verifyShopDomain(shop)) {
    return NextResponse.json(
      { error: 'Domaine de boutique invalide. Utilisez le format: ma-boutique.myshopify.com' },
      { status: 400 }
    );
  }

  const authUrl = getInstallUrl(shop);
  return NextResponse.json({ authUrl });
}
