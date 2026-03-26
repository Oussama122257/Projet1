import { NextRequest, NextResponse } from 'next/server';
import { verifyHmac, exchangeCodeForToken, verifyShopDomain } from '@/lib/shopify/auth';
import { ShopifyClient } from '@/lib/shopify/client';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const { shop, code } = params;

  if (!shop || !code) {
    return NextResponse.redirect(new URL('/auth/install?error=missing_params', req.url));
  }

  if (!verifyShopDomain(shop)) {
    return NextResponse.redirect(new URL('/auth/install?error=invalid_shop', req.url));
  }

  if (!verifyHmac(params)) {
    return NextResponse.redirect(new URL('/auth/install?error=invalid_hmac', req.url));
  }

  try {
    const accessToken = await exchangeCodeForToken(shop, code);
    const client = new ShopifyClient(shop, accessToken);
    const shopInfo = await client.getShopInfo();

    // Upsert shop in database
    await prisma.shop.upsert({
      where: { shopifyDomain: shop },
      update: {
        shopifyToken: accessToken,
        name: shopInfo.name,
        email: shopInfo.email,
        phone: shopInfo.phone,
        isActive: true,
      },
      create: {
        shopifyDomain: shop,
        shopifyToken: accessToken,
        name: shopInfo.name,
        email: shopInfo.email,
        phone: shopInfo.phone,
      },
    });

    // Register webhooks
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.SHOPIFY_HOST_NAME}`;
    await client.registerWebhooks(appUrl);

    return NextResponse.redirect(new URL('/dashboard', req.url));
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth/install?error=oauth_failed', req.url));
  }
}
