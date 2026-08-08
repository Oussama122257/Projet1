/**
 * Seed: 58 Wilayas + major Communes + courier fee grid + demo accounts.
 * Run with: npm run db:seed
 */
import { PrismaClient, DeliveryCompany } from "@prisma/client";
import bcrypt from "bcryptjs";
import { WILAYAS, ZONE_FEES } from "../src/data/wilayas";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Zeem Marketplace…");

  // 1. Wilayas + communes
  for (const w of WILAYAS) {
    const wilaya = await prisma.wilaya.upsert({
      where: { code: w.code },
      update: { name: w.name, zone: w.zone },
      create: { code: w.code, name: w.name, zone: w.zone },
    });
    for (const communeName of w.communes) {
      await prisma.commune.upsert({
        where: { wilayaId_name: { wilayaId: wilaya.id, name: communeName } },
        update: {},
        create: { name: communeName, wilayaId: wilaya.id },
      });
    }
  }
  console.log(`  ✔ ${WILAYAS.length} wilayas + communes`);

  // 2. Courier coverage: every courier serves every wilaya by default, priced
  //    by zone. Yalidine/ZR slightly premium on deep-south, Poste flat-ish.
  const wilayas = await prisma.wilaya.findMany();
  for (const wilaya of wilayas) {
    const base = ZONE_FEES[wilaya.zone];
    const grid: Array<{ company: DeliveryCompany; home: number; desk: number }> = [
      { company: "YALIDINE", home: base.home, desk: base.desk },
      { company: "ZR_EXPRESS", home: base.home + 50, desk: base.desk + 50 },
      { company: "POSTE", home: Math.min(base.home, 700), desk: Math.min(base.desk, 500) },
    ];
    for (const g of grid) {
      await prisma.delivery.upsert({
        where: { company_wilayaId: { company: g.company, wilayaId: wilaya.id } },
        update: {},
        create: {
          company: g.company,
          wilayaId: wilaya.id,
          homeFee: g.home,
          deskFee: g.desk,
        },
      });
    }
  }
  console.log("  ✔ Courier fee grid (Yalidine, ZR Express, Algérie Poste)");

  // 3. Demo accounts (change passwords in production!)
  const hash = await bcrypt.hash("zeem1234", 10);
  const algiers = await prisma.wilaya.findUniqueOrThrow({ where: { code: 16 } });
  const oran = await prisma.wilaya.findUniqueOrThrow({ where: { code: 31 } });

  await prisma.user.upsert({
    where: { phone: "+213550000001" },
    update: {},
    create: {
      name: "Admin Zeem",
      email: "admin@zeem.dz",
      phone: "+213550000001",
      password: hash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { phone: "+213550000002" },
    update: {},
    create: {
      name: "Boutique Yasmine",
      email: "seller@zeem.dz",
      phone: "+213550000002",
      password: hash,
      role: "SELLER",
      isVerified: true,
    },
  });

  const store = await prisma.store.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      name: "Boutique Yasmine",
      slug: "boutique-yasmine",
      description: "Kaftans et robes traditionnelles d'Alger, cousus main.",
      wilayaId: algiers.id,
      commune: "Alger Centre",
      isActive: true,
    },
  });

  const sellerUser2 = await prisma.user.upsert({
    where: { phone: "+213550000004" },
    update: {},
    create: {
      name: "Dar El Basma",
      email: "seller2@zeem.dz",
      phone: "+213550000004",
      password: hash,
      role: "SELLER",
      isVerified: true,
    },
  });

  const store2 = await prisma.store.upsert({
    where: { userId: sellerUser2.id },
    update: {},
    create: {
      userId: sellerUser2.id,
      name: "Dar El Basma",
      slug: "dar-el-basma",
      description: "Mode moderne et hijabs premium depuis Oran.",
      wilayaId: oran.id,
      commune: "Oran",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { phone: "+213550000003" },
    update: {},
    create: {
      name: "Agent Livraison Alger",
      phone: "+213550000003",
      password: hash,
      role: "AGENT",
      isVerified: true,
    },
  });

  // 4. Size chart + demo products
  const chart = await prisma.sizeChart.findFirst({ where: { storeId: store.id } })
    ?? await prisma.sizeChart.create({
      data: {
        storeId: store.id,
        name: "Robes & Kaftans femme",
        entries: [
          { size: "S", minWeightKg: 45, maxWeightKg: 58, minHeightCm: 150, maxHeightCm: 165 },
          { size: "M", minWeightKg: 58, maxWeightKg: 70, minHeightCm: 158, maxHeightCm: 172 },
          { size: "L", minWeightKg: 70, maxWeightKg: 82, minHeightCm: 162, maxHeightCm: 178 },
          { size: "XL", minWeightKg: 82, maxWeightKg: 95, minHeightCm: 165, maxHeightCm: 185 },
        ],
      },
    });

  const demoProducts = [
    {
      store: store, name: "Kaftan Royal Vert Émeraude", category: "Kaftans", price: 12500, comparePrice: 15000,
      description: "Kaftan de cérémonie brodé fil doré, idéal mariages et fêtes. Tissu satin premium, coupe traditionnelle algéroise.",
      sizes: ["S", "M", "L", "XL"], colors: ["Vert", "Doré"], stock: 24,
    },
    {
      store: store, name: "Robe de Soirée Mousseline Bordeaux", category: "Robes", price: 8900, comparePrice: null,
      description: "Robe longue en mousseline fluide, manches voilées, parfaite pour les soirées et henné.",
      sizes: ["S", "M", "L"], colors: ["Bordeaux", "Noir"], stock: 15,
    },
    {
      store: store2, name: "Hijab Soie de Médine Premium", category: "Hijabs", price: 1800, comparePrice: 2400,
      description: "Hijab soie de Médine, ne glisse pas, 12 coloris. Dimensions 180x70cm.",
      sizes: [], colors: ["Beige", "Noir", "Rose poudré", "Vert olive"], stock: 120,
    },
    {
      store: store2, name: "Abaya Dubai Moderne Noire", category: "Abayas", price: 6500, comparePrice: null,
      description: "Abaya coupe papillon avec broderies discrètes aux manches, tissu Nada crepe.",
      sizes: ["M", "L", "XL"], colors: ["Noir"], stock: 30,
    },
  ];

  for (const p of demoProducts) {
    const slug = p.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        storeId: p.store.id,
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        stock: p.stock,
        sizes: p.sizes,
        colors: p.colors,
        images: [],
        category: p.category,
        weight: 0.6,
        status: "PUBLISHED",
        sizeChartId: p.store.id === store.id ? chart.id : null,
      },
    });
  }
  console.log("  ✔ Demo accounts, stores, size chart, products");
  console.log("✅ Seed complete. Demo login: +213550000001 / zeem1234 (admin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
