/**
 * Generates prisma/neon-setup.sql — a single SQL file (schema + seed) that can
 * be pasted directly into the Neon / Supabase SQL editor, for people who
 * prefer raw SQL over `prisma migrate dev` + `npm run db:seed`.
 *
 * Regenerate after schema/seed changes:
 *   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/ddl.sql
 *   npx tsx prisma/generate-neon-sql.ts /tmp/ddl.sql
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";
import { WILAYAS, ZONE_FEES } from "../src/data/wilayas";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`; // SQL string escape
const wid = (code: number) => `wil_${String(code).padStart(2, "0")}`;

const lines: string[] = [];
const push = (sql: string) => lines.push(sql);

// ── Wilayas + communes ──────────────────────────────────────────────────────
push(`-- ═══════════════════════════════════════════════════════════════════`);
push(`-- SEED — 58 wilayas + communes principales`);
push(`-- ═══════════════════════════════════════════════════════════════════`);
for (const w of WILAYAS) {
  push(
    `INSERT INTO "Wilaya" ("id","name","code","zone") VALUES (${q(wid(w.code))},${q(w.name)},${w.code},${w.zone}) ON CONFLICT ("code") DO NOTHING;`
  );
  w.communes.forEach((c, i) => {
    const id = `com_${String(w.code).padStart(2, "0")}_${i + 1}`;
    push(
      `INSERT INTO "Commune" ("id","name","wilayaId") VALUES (${q(id)},${q(c)},${q(wid(w.code))}) ON CONFLICT ("wilayaId","name") DO NOTHING;`
    );
  });
}

// ── Courier fee grid (same logic as prisma/seed.ts) ─────────────────────────
push(``);
push(`-- Grille tarifaire par transporteur et wilaya`);
for (const w of WILAYAS) {
  const base = ZONE_FEES[w.zone];
  const rows: Array<[string, number, number]> = [
    ["YALIDINE", base.home, base.desk],
    ["ZR_EXPRESS", base.home + 50, base.desk + 50],
    ["POSTE", Math.min(base.home, 700), Math.min(base.desk, 500)],
  ];
  for (const [company, home, desk] of rows) {
    const id = `del_${company.toLowerCase()}_${String(w.code).padStart(2, "0")}`;
    push(
      `INSERT INTO "Delivery" ("id","company","wilayaId","homeFee","deskFee","isActive") VALUES (${q(id)},'${company}',${q(wid(w.code))},${home},${desk},true) ON CONFLICT ("company","wilayaId") DO NOTHING;`
    );
  }
}

// ── Demo accounts (password: zeem1234) ──────────────────────────────────────
const hash = bcrypt.hashSync("zeem1234", 10);
push(``);
push(`-- Comptes démo — mot de passe: zeem1234 (CHANGEZ-LES EN PRODUCTION)`);
const users: Array<[string, string, string | null, string, string]> = [
  ["usr_admin", "Admin Zeem", "admin@zeem.dz", "+213550000001", "ADMIN"],
  ["usr_seller1", "Boutique Yasmine", "seller@zeem.dz", "+213550000002", "SELLER"],
  ["usr_seller2", "Dar El Basma", "seller2@zeem.dz", "+213550000004", "SELLER"],
  ["usr_agent", "Agent Livraison Alger", null, "+213550000003", "AGENT"],
];
for (const [id, name, email, phone, role] of users) {
  push(
    `INSERT INTO "User" ("id","name","email","phone","password","role","isVerified") VALUES (${q(id)},${q(name)},${email ? q(email) : "NULL"},${q(phone)},${q(hash)},'${role}',true) ON CONFLICT ("phone") DO NOTHING;`
  );
}

push(``);
push(`-- Boutiques démo`);
push(
  `INSERT INTO "Store" ("id","userId","name","slug","description","wilayaId","commune","isActive","commissionRate","balance") VALUES ('str_1','usr_seller1','Boutique Yasmine','boutique-yasmine',${q("Kaftans et robes traditionnelles d'Alger, cousus main.")},'wil_16','Alger Centre',true,10.0,0.0) ON CONFLICT ("userId") DO NOTHING;`
);
push(
  `INSERT INTO "Store" ("id","userId","name","slug","description","wilayaId","commune","isActive","commissionRate","balance") VALUES ('str_2','usr_seller2','Dar El Basma','dar-el-basma',${q("Mode moderne et hijabs premium depuis Oran.")},'wil_31','Oran',true,10.0,0.0) ON CONFLICT ("userId") DO NOTHING;`
);

push(``);
push(`-- Grille des tailles (utilisée par le recommandeur IA)`);
const chartEntries = JSON.stringify([
  { size: "S", minWeightKg: 45, maxWeightKg: 58, minHeightCm: 150, maxHeightCm: 165 },
  { size: "M", minWeightKg: 58, maxWeightKg: 70, minHeightCm: 158, maxHeightCm: 172 },
  { size: "L", minWeightKg: 70, maxWeightKg: 82, minHeightCm: 162, maxHeightCm: 178 },
  { size: "XL", minWeightKg: 82, maxWeightKg: 95, minHeightCm: 165, maxHeightCm: 185 },
]);
push(
  `INSERT INTO "SizeChart" ("id","storeId","name","entries") VALUES ('sch_1','str_1','Robes & Kaftans femme',${q(chartEntries)}::jsonb) ON CONFLICT ("id") DO NOTHING;`
);

push(``);
push(`-- Produits démo`);
interface DemoProduct {
  id: string; store: string; name: string; slug: string; desc: string;
  price: number; compare: number | null; stock: number;
  sizes: string[]; colors: string[]; category: string; chart: string | null;
}
const products: DemoProduct[] = [
  { id: "prd_1", store: "str_1", name: "Kaftan Royal Vert Émeraude", slug: "kaftan-royal-vert-emeraude", desc: "Kaftan de cérémonie brodé fil doré, idéal mariages et fêtes. Tissu satin premium, coupe traditionnelle algéroise.", price: 12500, compare: 15000, stock: 24, sizes: ["S", "M", "L", "XL"], colors: ["Vert", "Doré"], category: "Kaftans", chart: "sch_1" },
  { id: "prd_2", store: "str_1", name: "Robe de Soirée Mousseline Bordeaux", slug: "robe-de-soiree-mousseline-bordeaux", desc: "Robe longue en mousseline fluide, manches voilées, parfaite pour les soirées et henné.", price: 8900, compare: null, stock: 15, sizes: ["S", "M", "L"], colors: ["Bordeaux", "Noir"], category: "Robes", chart: "sch_1" },
  { id: "prd_3", store: "str_2", name: "Hijab Soie de Médine Premium", slug: "hijab-soie-de-medine-premium", desc: "Hijab soie de Médine, ne glisse pas, 12 coloris. Dimensions 180x70cm.", price: 1800, compare: 2400, stock: 120, sizes: [], colors: ["Beige", "Noir", "Rose poudré", "Vert olive"], category: "Hijabs", chart: null },
  { id: "prd_4", store: "str_2", name: "Abaya Dubai Moderne Noire", slug: "abaya-dubai-moderne-noire", desc: "Abaya coupe papillon avec broderies discrètes aux manches, tissu Nada crepe.", price: 6500, compare: null, stock: 30, sizes: ["M", "L", "XL"], colors: ["Noir"], category: "Abayas", chart: null },
];
const arr = (xs: string[]) => (xs.length ? `ARRAY[${xs.map(q).join(",")}]` : `ARRAY[]::text[]`);
for (const p of products) {
  push(
    `INSERT INTO "Product" ("id","storeId","name","slug","description","price","comparePrice","stock","sizes","colors","images","category","weight","status","sizeChartId") VALUES (${q(p.id)},${q(p.store)},${q(p.name)},${q(p.slug)},${q(p.desc)},${p.price},${p.compare ?? "NULL"},${p.stock},${arr(p.sizes)},${arr(p.colors)},ARRAY[]::text[],${q(p.category)},0.6,'PUBLISHED',${p.chart ? q(p.chart) : "NULL"}) ON CONFLICT ("slug") DO NOTHING;`
  );
}

// ── Assemble: DDL + seed ────────────────────────────────────────────────────
const ddlPath = process.argv[2];
if (!ddlPath) {
  console.error("Usage: npx tsx prisma/generate-neon-sql.ts <path-to-ddl.sql>");
  process.exit(1);
}
const ddl = readFileSync(ddlPath, "utf8");

const header = `-- ═══════════════════════════════════════════════════════════════════
-- ZEEM MARKETPLACE — installation complète de la base de données
-- À coller tel quel dans le SQL Editor de Neon.tech (ou Supabase / psql).
-- Contenu: schéma complet + 58 wilayas + communes + tarifs livraison
--          + comptes démo (mot de passe: zeem1234) + produits démo.
-- À exécuter sur une base VIDE (le schéma ne se ré-exécute pas);
-- la partie seed, elle, est idempotente (ON CONFLICT DO NOTHING).
-- Généré depuis prisma/schema.prisma — ne pas éditer à la main,
-- relancer prisma/generate-neon-sql.ts à la place.
-- ═══════════════════════════════════════════════════════════════════

`;

const out = header + ddl + "\n" + lines.join("\n") + "\n";
const outPath = join(__dirname, "neon-setup.sql");
writeFileSync(outPath, out);
console.log(`✅ ${outPath} (${out.split("\n").length} lignes)`);
