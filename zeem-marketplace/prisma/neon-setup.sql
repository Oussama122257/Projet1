-- ═══════════════════════════════════════════════════════════════════
-- ZEEM MARKETPLACE — installation complète de la base de données
-- À coller tel quel dans le SQL Editor de Neon.tech (ou Supabase / psql).
-- Contenu: schéma complet + 58 wilayas + communes + tarifs livraison
--          + comptes démo (mot de passe: zeem1234) + produits démo.
-- À exécuter sur une base VIDE (le schéma ne se ré-exécute pas);
-- la partie seed, elle, est idempotente (ON CONFLICT DO NOTHING).
-- Généré depuis prisma/schema.prisma — ne pas éditer à la main,
-- relancer prisma/generate-neon-sql.ts à la place.
-- ═══════════════════════════════════════════════════════════════════

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CheckoutType" AS ENUM ('FAST', 'CART');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING_PICKUP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TransType" AS ENUM ('COMMISSION', 'PAYOUT', 'REFUND');

-- CreateEnum
CREATE TYPE "TransStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "DeliveryCompany" AS ENUM ('YALIDINE', 'ZR_EXPRESS', 'POSTE');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "Wilaya" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "zone" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Wilaya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commune" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wilayaId" TEXT NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "company" "DeliveryCompany" NOT NULL,
    "wilayaId" TEXT NOT NULL,
    "homeFee" DOUBLE PRECISION NOT NULL,
    "deskFee" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "wilayaId" TEXT NOT NULL,
    "communeId" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "wilayaId" TEXT NOT NULL,
    "commune" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "licenceUrl" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeChart" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entries" JSONB NOT NULL,

    CONSTRAINT "SizeChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "comparePrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL,
    "sizes" TEXT[],
    "colors" TEXT[],
    "images" TEXT[],
    "category" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "aiGeneratedDesc" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "sizeChartId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "buyerId" TEXT,
    "guestName" TEXT,
    "guestPhone" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutType" "CheckoutType" NOT NULL,
    "utmSource" TEXT,
    "utmCampaign" TEXT,
    "pixelEventId" TEXT,
    "addressId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "size" TEXT,
    "color" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "deliveryCompany" "DeliveryCompany" NOT NULL,
    "trackingNumber" TEXT,
    "waybillUrl" TEXT,
    "shippingFee" DOUBLE PRECISION NOT NULL,
    "codAmount" DOUBLE PRECISION NOT NULL,
    "actualCollected" DOUBLE PRECISION,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING_PICKUP',
    "agentId" TEXT,
    "agentNote" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "signatureUrl" TEXT,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransType" NOT NULL,
    "status" "TransStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "minAmount" DOUBLE PRECISION,
    "maxUses" INTEGER NOT NULL DEFAULT 100,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlashSale" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "productIds" TEXT[],
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FlashSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PixelEventLog" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "orderId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixelEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wilaya_name_key" ON "Wilaya"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Wilaya_code_key" ON "Wilaya"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_wilayaId_name_key" ON "Commune"("wilayaId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_company_wilayaId_key" ON "Delivery"("company", "wilayaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Store_userId_key" ON "Store"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_storeId_status_idx" ON "Product"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Shipment_agentId_status_idx" ON "Shipment"("agentId", "status");

-- CreateIndex
CREATE INDEX "Shipment_sellerId_status_idx" ON "Shipment"("sellerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- AddForeignKey
ALTER TABLE "Commune" ADD CONSTRAINT "Commune_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "Wilaya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "Wilaya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "Wilaya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_wilayaId_fkey" FOREIGN KEY ("wilayaId") REFERENCES "Wilaya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SizeChart" ADD CONSTRAINT "SizeChart_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ═══════════════════════════════════════════════════════════════════
-- SEED — 58 wilayas + communes principales
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_01','Adrar',1,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_01_1','Adrar','wil_01') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_01_2','Reggane','wil_01') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_01_3','Timimoun','wil_01') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_01_4','Aoulef','wil_01') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_02','Chlef',2,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_02_1','Chlef','wil_02') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_02_2','Ténès','wil_02') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_02_3','Boukadir','wil_02') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_02_4','Oued Fodda','wil_02') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_03','Laghouat',3,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_03_1','Laghouat','wil_03') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_03_2','Aflou','wil_03') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_03_3','Ksar El Hirane','wil_03') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_04','Oum El Bouaghi',4,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_04_1','Oum El Bouaghi','wil_04') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_04_2','Aïn Beïda','wil_04') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_04_3','Aïn M''lila','wil_04') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_05','Batna',5,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_05_1','Batna','wil_05') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_05_2','Barika','wil_05') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_05_3','Merouana','wil_05') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_05_4','Arris','wil_05') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_06','Béjaïa',6,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_06_1','Béjaïa','wil_06') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_06_2','Akbou','wil_06') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_06_3','Kherrata','wil_06') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_06_4','Amizour','wil_06') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_06_5','El Kseur','wil_06') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_07','Biskra',7,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_07_1','Biskra','wil_07') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_07_2','Tolga','wil_07') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_07_3','Sidi Okba','wil_07') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_07_4','Ouled Djellal','wil_07') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_08','Béchar',8,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_08_1','Béchar','wil_08') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_08_2','Kenadsa','wil_08') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_08_3','Abadla','wil_08') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_09','Blida',9,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_09_1','Blida','wil_09') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_09_2','Boufarik','wil_09') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_09_3','El Affroun','wil_09') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_09_4','Mouzaïa','wil_09') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_09_5','Larbaâ','wil_09') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_10','Bouira',10,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_10_1','Bouira','wil_10') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_10_2','Lakhdaria','wil_10') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_10_3','Sour El Ghozlane','wil_10') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_10_4','M''Chedallah','wil_10') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_11','Tamanrasset',11,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_11_1','Tamanrasset','wil_11') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_11_2','In Salah','wil_11') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_11_3','Abalessa','wil_11') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_12','Tébessa',12,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_12_1','Tébessa','wil_12') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_12_2','Bir El Ater','wil_12') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_12_3','Cheria','wil_12') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_13','Tlemcen',13,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_13_1','Tlemcen','wil_13') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_13_2','Maghnia','wil_13') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_13_3','Remchi','wil_13') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_13_4','Ghazaouet','wil_13') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_13_5','Nedroma','wil_13') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_14','Tiaret',14,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_14_1','Tiaret','wil_14') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_14_2','Sougueur','wil_14') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_14_3','Frenda','wil_14') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_14_4','Ksar Chellala','wil_14') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_15','Tizi Ouzou',15,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_15_1','Tizi Ouzou','wil_15') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_15_2','Azazga','wil_15') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_15_3','Draâ Ben Khedda','wil_15') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_15_4','Larbaâ Nath Irathen','wil_15') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_16','Alger',16,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_1','Alger Centre','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_2','Bab El Oued','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_3','Hussein Dey','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_4','El Harrach','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_5','Bir Mourad Raïs','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_6','Kouba','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_7','Hydra','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_8','Chéraga','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_9','Dar El Beïda','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_10','Rouiba','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_11','Zéralda','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_12','Draria','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_13','Birtouta','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_14','Baraki','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_16_15','Bordj El Kiffan','wil_16') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_17','Djelfa',17,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_17_1','Djelfa','wil_17') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_17_2','Messaad','wil_17') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_17_3','Aïn Oussera','wil_17') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_17_4','Hassi Bahbah','wil_17') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_18','Jijel',18,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_18_1','Jijel','wil_18') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_18_2','Taher','wil_18') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_18_3','El Milia','wil_18') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_19','Sétif',19,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_19_1','Sétif','wil_19') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_19_2','El Eulma','wil_19') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_19_3','Aïn Oulmène','wil_19') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_19_4','Bougaâ','wil_19') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_20','Saïda',20,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_20_1','Saïda','wil_20') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_20_2','El Hassasna','wil_20') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_20_3','Aïn El Hadjar','wil_20') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_21','Skikda',21,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_21_1','Skikda','wil_21') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_21_2','Azzaba','wil_21') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_21_3','Collo','wil_21') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_21_4','El Harrouch','wil_21') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_22','Sidi Bel Abbès',22,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_22_1','Sidi Bel Abbès','wil_22') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_22_2','Telagh','wil_22') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_22_3','Sfisef','wil_22') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_23','Annaba',23,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_23_1','Annaba','wil_23') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_23_2','El Bouni','wil_23') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_23_3','El Hadjar','wil_23') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_23_4','Berrahal','wil_23') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_24','Guelma',24,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_24_1','Guelma','wil_24') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_24_2','Oued Zenati','wil_24') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_24_3','Bouchegouf','wil_24') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_25','Constantine',25,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_25_1','Constantine','wil_25') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_25_2','El Khroub','wil_25') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_25_3','Aïn Smara','wil_25') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_25_4','Didouche Mourad','wil_25') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_25_5','Zighoud Youcef','wil_25') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_26','Médéa',26,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_26_1','Médéa','wil_26') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_26_2','Berrouaghia','wil_26') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_26_3','Ksar El Boukhari','wil_26') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_26_4','Tablat','wil_26') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_27','Mostaganem',27,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_27_1','Mostaganem','wil_27') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_27_2','Aïn Nouissy','wil_27') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_27_3','Sidi Ali','wil_27') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_27_4','Hassi Mameche','wil_27') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_28','M''Sila',28,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_28_1','M''Sila','wil_28') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_28_2','Bou Saâda','wil_28') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_28_3','Sidi Aïssa','wil_28') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_28_4','Magra','wil_28') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_29','Mascara',29,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_29_1','Mascara','wil_29') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_29_2','Sig','wil_29') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_29_3','Mohammadia','wil_29') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_29_4','Tighennif','wil_29') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_30','Ouargla',30,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_30_1','Ouargla','wil_30') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_30_2','Hassi Messaoud','wil_30') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_30_3','Rouissat','wil_30') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_31','Oran',31,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_31_1','Oran','wil_31') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_31_2','Bir El Djir','wil_31') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_31_3','Es Sénia','wil_31') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_31_4','Arzew','wil_31') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_31_5','Aïn El Turk','wil_31') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_31_6','Gdyel','wil_31') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_32','El Bayadh',32,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_32_1','El Bayadh','wil_32') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_32_2','Bougtoub','wil_32') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_32_3','Brezina','wil_32') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_33','Illizi',33,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_33_1','Illizi','wil_33') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_33_2','In Aménas','wil_33') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_34','Bordj Bou Arreridj',34,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_34_1','Bordj Bou Arreridj','wil_34') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_34_2','Ras El Oued','wil_34') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_34_3','Medjana','wil_34') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_35','Boumerdès',35,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_35_1','Boumerdès','wil_35') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_35_2','Boudouaou','wil_35') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_35_3','Bordj Menaïel','wil_35') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_35_4','Dellys','wil_35') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_35_5','Khemis El Khechna','wil_35') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_36','El Tarf',36,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_36_1','El Tarf','wil_36') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_36_2','El Kala','wil_36') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_36_3','Dréan','wil_36') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_36_4','Ben M''Hidi','wil_36') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_37','Tindouf',37,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_37_1','Tindouf','wil_37') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_37_2','Oum El Assel','wil_37') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_38','Tissemsilt',38,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_38_1','Tissemsilt','wil_38') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_38_2','Theniet El Had','wil_38') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_38_3','Bordj Bou Naama','wil_38') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_39','El Oued',39,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_39_1','El Oued','wil_39') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_39_2','Guemar','wil_39') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_39_3','Debila','wil_39') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_39_4','Robbah','wil_39') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_40','Khenchela',40,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_40_1','Khenchela','wil_40') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_40_2','Kais','wil_40') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_40_3','Chechar','wil_40') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_41','Souk Ahras',41,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_41_1','Souk Ahras','wil_41') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_41_2','Sedrata','wil_41') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_41_3','M''daourouch','wil_41') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_42','Tipaza',42,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_42_1','Tipaza','wil_42') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_42_2','Koléa','wil_42') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_42_3','Cherchell','wil_42') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_42_4','Hadjout','wil_42') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_42_5','Fouka','wil_42') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_43','Mila',43,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_43_1','Mila','wil_43') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_43_2','Chelghoum Laïd','wil_43') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_43_3','Ferdjioua','wil_43') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_43_4','Tadjenanet','wil_43') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_44','Aïn Defla',44,1) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_44_1','Aïn Defla','wil_44') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_44_2','Khemis Miliana','wil_44') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_44_3','El Attaf','wil_44') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_44_4','Miliana','wil_44') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_45','Naâma',45,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_45_1','Naâma','wil_45') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_45_2','Mécheria','wil_45') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_45_3','Aïn Sefra','wil_45') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_46','Aïn Témouchent',46,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_46_1','Aïn Témouchent','wil_46') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_46_2','Hammam Bou Hadjar','wil_46') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_46_3','Béni Saf','wil_46') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_46_4','El Malah','wil_46') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_47','Ghardaïa',47,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_47_1','Ghardaïa','wil_47') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_47_2','Metlili','wil_47') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_47_3','El Guerrara','wil_47') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_47_4','Berriane','wil_47') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_48','Relizane',48,2) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_48_1','Relizane','wil_48') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_48_2','Oued Rhiou','wil_48') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_48_3','Mazouna','wil_48') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_48_4','Zemmora','wil_48') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_49','Timimoun',49,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_49_1','Timimoun','wil_49') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_49_2','Aougrout','wil_49') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_49_3','Charouine','wil_49') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_50','Bordj Badji Mokhtar',50,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_50_1','Bordj Badji Mokhtar','wil_50') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_50_2','Timiaouine','wil_50') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_51','Ouled Djellal',51,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_51_1','Ouled Djellal','wil_51') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_51_2','Sidi Khaled','wil_51') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_51_3','Doucen','wil_51') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_52','Béni Abbès',52,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_52_1','Béni Abbès','wil_52') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_52_2','Igli','wil_52') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_52_3','Kerzaz','wil_52') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_53','In Salah',53,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_53_1','In Salah','wil_53') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_53_2','In Ghar','wil_53') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_53_3','Foggaret Ezzaouia','wil_53') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_54','In Guezzam',54,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_54_1','In Guezzam','wil_54') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_54_2','Tin Zaouatine','wil_54') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_55','Touggourt',55,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_55_1','Touggourt','wil_55') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_55_2','Nezla','wil_55') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_55_3','Zaouia El Abidia','wil_55') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_55_4','Témacine','wil_55') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_56','Djanet',56,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_56_1','Djanet','wil_56') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_56_2','Bordj El Haouas','wil_56') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_57','El M''Ghair',57,3) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_57_1','El M''Ghair','wil_57') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_57_2','Djamaa','wil_57') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_57_3','Sidi Amrane','wil_57') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Wilaya" ("id","name","code","zone") VALUES ('wil_58','El Meniaa',58,4) ON CONFLICT ("code") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_58_1','El Meniaa','wil_58') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_58_2','Hassi Gara','wil_58') ON CONFLICT ("wilayaId","name") DO NOTHING;
INSERT INTO "Commune" ("id","name","wilayaId") VALUES ('com_58_3','Mansourah','wil_58') ON CONFLICT ("wilayaId","name") DO NOTHING;

-- Grille tarifaire par transporteur et wilaya
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_01','YALIDINE','wil_01',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_01','ZR_EXPRESS','wil_01',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_01','POSTE','wil_01',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_02','YALIDINE','wil_02',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_02','ZR_EXPRESS','wil_02',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_02','POSTE','wil_02',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_03','YALIDINE','wil_03',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_03','ZR_EXPRESS','wil_03',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_03','POSTE','wil_03',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_04','YALIDINE','wil_04',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_04','ZR_EXPRESS','wil_04',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_04','POSTE','wil_04',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_05','YALIDINE','wil_05',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_05','ZR_EXPRESS','wil_05',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_05','POSTE','wil_05',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_06','YALIDINE','wil_06',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_06','ZR_EXPRESS','wil_06',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_06','POSTE','wil_06',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_07','YALIDINE','wil_07',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_07','ZR_EXPRESS','wil_07',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_07','POSTE','wil_07',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_08','YALIDINE','wil_08',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_08','ZR_EXPRESS','wil_08',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_08','POSTE','wil_08',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_09','YALIDINE','wil_09',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_09','ZR_EXPRESS','wil_09',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_09','POSTE','wil_09',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_10','YALIDINE','wil_10',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_10','ZR_EXPRESS','wil_10',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_10','POSTE','wil_10',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_11','YALIDINE','wil_11',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_11','ZR_EXPRESS','wil_11',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_11','POSTE','wil_11',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_12','YALIDINE','wil_12',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_12','ZR_EXPRESS','wil_12',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_12','POSTE','wil_12',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_13','YALIDINE','wil_13',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_13','ZR_EXPRESS','wil_13',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_13','POSTE','wil_13',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_14','YALIDINE','wil_14',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_14','ZR_EXPRESS','wil_14',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_14','POSTE','wil_14',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_15','YALIDINE','wil_15',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_15','ZR_EXPRESS','wil_15',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_15','POSTE','wil_15',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_16','YALIDINE','wil_16',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_16','ZR_EXPRESS','wil_16',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_16','POSTE','wil_16',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_17','YALIDINE','wil_17',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_17','ZR_EXPRESS','wil_17',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_17','POSTE','wil_17',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_18','YALIDINE','wil_18',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_18','ZR_EXPRESS','wil_18',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_18','POSTE','wil_18',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_19','YALIDINE','wil_19',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_19','ZR_EXPRESS','wil_19',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_19','POSTE','wil_19',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_20','YALIDINE','wil_20',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_20','ZR_EXPRESS','wil_20',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_20','POSTE','wil_20',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_21','YALIDINE','wil_21',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_21','ZR_EXPRESS','wil_21',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_21','POSTE','wil_21',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_22','YALIDINE','wil_22',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_22','ZR_EXPRESS','wil_22',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_22','POSTE','wil_22',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_23','YALIDINE','wil_23',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_23','ZR_EXPRESS','wil_23',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_23','POSTE','wil_23',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_24','YALIDINE','wil_24',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_24','ZR_EXPRESS','wil_24',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_24','POSTE','wil_24',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_25','YALIDINE','wil_25',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_25','ZR_EXPRESS','wil_25',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_25','POSTE','wil_25',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_26','YALIDINE','wil_26',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_26','ZR_EXPRESS','wil_26',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_26','POSTE','wil_26',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_27','YALIDINE','wil_27',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_27','ZR_EXPRESS','wil_27',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_27','POSTE','wil_27',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_28','YALIDINE','wil_28',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_28','ZR_EXPRESS','wil_28',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_28','POSTE','wil_28',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_29','YALIDINE','wil_29',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_29','ZR_EXPRESS','wil_29',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_29','POSTE','wil_29',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_30','YALIDINE','wil_30',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_30','ZR_EXPRESS','wil_30',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_30','POSTE','wil_30',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_31','YALIDINE','wil_31',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_31','ZR_EXPRESS','wil_31',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_31','POSTE','wil_31',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_32','YALIDINE','wil_32',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_32','ZR_EXPRESS','wil_32',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_32','POSTE','wil_32',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_33','YALIDINE','wil_33',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_33','ZR_EXPRESS','wil_33',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_33','POSTE','wil_33',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_34','YALIDINE','wil_34',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_34','ZR_EXPRESS','wil_34',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_34','POSTE','wil_34',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_35','YALIDINE','wil_35',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_35','ZR_EXPRESS','wil_35',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_35','POSTE','wil_35',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_36','YALIDINE','wil_36',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_36','ZR_EXPRESS','wil_36',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_36','POSTE','wil_36',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_37','YALIDINE','wil_37',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_37','ZR_EXPRESS','wil_37',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_37','POSTE','wil_37',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_38','YALIDINE','wil_38',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_38','ZR_EXPRESS','wil_38',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_38','POSTE','wil_38',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_39','YALIDINE','wil_39',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_39','ZR_EXPRESS','wil_39',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_39','POSTE','wil_39',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_40','YALIDINE','wil_40',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_40','ZR_EXPRESS','wil_40',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_40','POSTE','wil_40',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_41','YALIDINE','wil_41',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_41','ZR_EXPRESS','wil_41',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_41','POSTE','wil_41',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_42','YALIDINE','wil_42',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_42','ZR_EXPRESS','wil_42',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_42','POSTE','wil_42',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_43','YALIDINE','wil_43',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_43','ZR_EXPRESS','wil_43',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_43','POSTE','wil_43',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_44','YALIDINE','wil_44',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_44','ZR_EXPRESS','wil_44',550,400,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_44','POSTE','wil_44',500,350,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_45','YALIDINE','wil_45',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_45','ZR_EXPRESS','wil_45',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_45','POSTE','wil_45',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_46','YALIDINE','wil_46',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_46','ZR_EXPRESS','wil_46',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_46','POSTE','wil_46',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_47','YALIDINE','wil_47',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_47','ZR_EXPRESS','wil_47',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_47','POSTE','wil_47',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_48','YALIDINE','wil_48',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_48','ZR_EXPRESS','wil_48',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_48','POSTE','wil_48',650,450,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_49','YALIDINE','wil_49',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_49','ZR_EXPRESS','wil_49',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_49','POSTE','wil_49',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_50','YALIDINE','wil_50',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_50','ZR_EXPRESS','wil_50',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_50','POSTE','wil_50',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_51','YALIDINE','wil_51',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_51','ZR_EXPRESS','wil_51',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_51','POSTE','wil_51',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_52','YALIDINE','wil_52',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_52','ZR_EXPRESS','wil_52',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_52','POSTE','wil_52',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_53','YALIDINE','wil_53',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_53','ZR_EXPRESS','wil_53',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_53','POSTE','wil_53',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_54','YALIDINE','wil_54',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_54','ZR_EXPRESS','wil_54',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_54','POSTE','wil_54',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_55','YALIDINE','wil_55',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_55','ZR_EXPRESS','wil_55',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_55','POSTE','wil_55',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_56','YALIDINE','wil_56',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_56','ZR_EXPRESS','wil_56',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_56','POSTE','wil_56',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_57','YALIDINE','wil_57',850,600,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_57','ZR_EXPRESS','wil_57',900,650,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_57','POSTE','wil_57',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_yalidine_58','YALIDINE','wil_58',1200,900,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_zr_express_58','ZR_EXPRESS','wil_58',1250,950,true) ON CONFLICT ("company","wilayaId") DO NOTHING;
INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES ('del_poste_58','POSTE','wil_58',700,500,true) ON CONFLICT ("company","wilayaId") DO NOTHING;

-- Comptes démo — mot de passe: zeem1234 (CHANGEZ-LES EN PRODUCTION)
INSERT INTO "User" ("id","name","email","phone","password","role","isVerified") VALUES ('usr_admin','Admin Zeem','admin@zeem.dz','+213550000001','$2a$10$dpCcHam6FzKJZkYXAIqA2e/UrCMMzSv83CNktoaW/VA/wr.drW9om','ADMIN',true) ON CONFLICT ("phone") DO NOTHING;
INSERT INTO "User" ("id","name","email","phone","password","role","isVerified") VALUES ('usr_seller1','Boutique Yasmine','seller@zeem.dz','+213550000002','$2a$10$dpCcHam6FzKJZkYXAIqA2e/UrCMMzSv83CNktoaW/VA/wr.drW9om','SELLER',true) ON CONFLICT ("phone") DO NOTHING;
INSERT INTO "User" ("id","name","email","phone","password","role","isVerified") VALUES ('usr_seller2','Dar El Basma','seller2@zeem.dz','+213550000004','$2a$10$dpCcHam6FzKJZkYXAIqA2e/UrCMMzSv83CNktoaW/VA/wr.drW9om','SELLER',true) ON CONFLICT ("phone") DO NOTHING;
INSERT INTO "User" ("id","name","email","phone","password","role","isVerified") VALUES ('usr_agent','Agent Livraison Alger',NULL,'+213550000003','$2a$10$dpCcHam6FzKJZkYXAIqA2e/UrCMMzSv83CNktoaW/VA/wr.drW9om','AGENT',true) ON CONFLICT ("phone") DO NOTHING;

-- Boutiques démo
INSERT INTO "Store" ("id","userId","name","slug","description","wilayaId","commune","isActive","commissionRate","balance") VALUES ('str_1','usr_seller1','Boutique Yasmine','boutique-yasmine','Kaftans et robes traditionnelles d''Alger, cousus main.','wil_16','Alger Centre',true,10.0,0.0) ON CONFLICT ("userId") DO NOTHING;
INSERT INTO "Store" ("id","userId","name","slug","description","wilayaId","commune","isActive","commissionRate","balance") VALUES ('str_2','usr_seller2','Dar El Basma','dar-el-basma','Mode moderne et hijabs premium depuis Oran.','wil_31','Oran',true,10.0,0.0) ON CONFLICT ("userId") DO NOTHING;

-- Grille des tailles (utilisée par le recommandeur IA)
INSERT INTO "SizeChart" ("id","storeId","name","entries") VALUES ('sch_1','str_1','Robes & Kaftans femme','[{"size":"S","minWeightKg":45,"maxWeightKg":58,"minHeightCm":150,"maxHeightCm":165},{"size":"M","minWeightKg":58,"maxWeightKg":70,"minHeightCm":158,"maxHeightCm":172},{"size":"L","minWeightKg":70,"maxWeightKg":82,"minHeightCm":162,"maxHeightCm":178},{"size":"XL","minWeightKg":82,"maxWeightKg":95,"minHeightCm":165,"maxHeightCm":185}]'::jsonb) ON CONFLICT ("id") DO NOTHING;

-- Produits démo
INSERT INTO "Product" ("id","storeId","name","slug","description","price","comparePrice","stock","sizes","colors","images","category","weight","status","sizeChartId") VALUES ('prd_1','str_1','Kaftan Royal Vert Émeraude','kaftan-royal-vert-emeraude','Kaftan de cérémonie brodé fil doré, idéal mariages et fêtes. Tissu satin premium, coupe traditionnelle algéroise.',12500,15000,24,ARRAY['S','M','L','XL'],ARRAY['Vert','Doré'],ARRAY[]::text[],'Kaftans',0.6,'PUBLISHED','sch_1') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id","storeId","name","slug","description","price","comparePrice","stock","sizes","colors","images","category","weight","status","sizeChartId") VALUES ('prd_2','str_1','Robe de Soirée Mousseline Bordeaux','robe-de-soiree-mousseline-bordeaux','Robe longue en mousseline fluide, manches voilées, parfaite pour les soirées et henné.',8900,NULL,15,ARRAY['S','M','L'],ARRAY['Bordeaux','Noir'],ARRAY[]::text[],'Robes',0.6,'PUBLISHED','sch_1') ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id","storeId","name","slug","description","price","comparePrice","stock","sizes","colors","images","category","weight","status","sizeChartId") VALUES ('prd_3','str_2','Hijab Soie de Médine Premium','hijab-soie-de-medine-premium','Hijab soie de Médine, ne glisse pas, 12 coloris. Dimensions 180x70cm.',1800,2400,120,ARRAY[]::text[],ARRAY['Beige','Noir','Rose poudré','Vert olive'],ARRAY[]::text[],'Hijabs',0.6,'PUBLISHED',NULL) ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id","storeId","name","slug","description","price","comparePrice","stock","sizes","colors","images","category","weight","status","sizeChartId") VALUES ('prd_4','str_2','Abaya Dubai Moderne Noire','abaya-dubai-moderne-noire','Abaya coupe papillon avec broderies discrètes aux manches, tissu Nada crepe.',6500,NULL,30,ARRAY['M','L','XL'],ARRAY['Noir'],ARRAY[]::text[],'Abayas',0.6,'PUBLISHED',NULL) ON CONFLICT ("slug") DO NOTHING;
