/**
 * The 58 Wilayas of Algeria (post-2019 redistricting) with:
 *  - official code (01–58)
 *  - shipping zone (1 = north/center → 4 = deep south) used for fallback
 *    delivery pricing when a courier has no explicit fee row
 *  - a starter list of major communes (extend via admin panel / re-seed)
 */
export interface WilayaSeed {
  code: number;
  name: string;
  zone: 1 | 2 | 3 | 4;
  communes: string[];
}

export const WILAYAS: WilayaSeed[] = [
  { code: 1, name: "Adrar", zone: 4, communes: ["Adrar", "Reggane", "Timimoun", "Aoulef"] },
  { code: 2, name: "Chlef", zone: 1, communes: ["Chlef", "Ténès", "Boukadir", "Oued Fodda"] },
  { code: 3, name: "Laghouat", zone: 3, communes: ["Laghouat", "Aflou", "Ksar El Hirane"] },
  { code: 4, name: "Oum El Bouaghi", zone: 2, communes: ["Oum El Bouaghi", "Aïn Beïda", "Aïn M'lila"] },
  { code: 5, name: "Batna", zone: 2, communes: ["Batna", "Barika", "Merouana", "Arris"] },
  { code: 6, name: "Béjaïa", zone: 1, communes: ["Béjaïa", "Akbou", "Kherrata", "Amizour", "El Kseur"] },
  { code: 7, name: "Biskra", zone: 3, communes: ["Biskra", "Tolga", "Sidi Okba", "Ouled Djellal"] },
  { code: 8, name: "Béchar", zone: 4, communes: ["Béchar", "Kenadsa", "Abadla"] },
  { code: 9, name: "Blida", zone: 1, communes: ["Blida", "Boufarik", "El Affroun", "Mouzaïa", "Larbaâ"] },
  { code: 10, name: "Bouira", zone: 1, communes: ["Bouira", "Lakhdaria", "Sour El Ghozlane", "M'Chedallah"] },
  { code: 11, name: "Tamanrasset", zone: 4, communes: ["Tamanrasset", "In Salah", "Abalessa"] },
  { code: 12, name: "Tébessa", zone: 2, communes: ["Tébessa", "Bir El Ater", "Cheria"] },
  { code: 13, name: "Tlemcen", zone: 2, communes: ["Tlemcen", "Maghnia", "Remchi", "Ghazaouet", "Nedroma"] },
  { code: 14, name: "Tiaret", zone: 2, communes: ["Tiaret", "Sougueur", "Frenda", "Ksar Chellala"] },
  { code: 15, name: "Tizi Ouzou", zone: 1, communes: ["Tizi Ouzou", "Azazga", "Draâ Ben Khedda", "Larbaâ Nath Irathen"] },
  { code: 16, name: "Alger", zone: 1, communes: ["Alger Centre", "Bab El Oued", "Hussein Dey", "El Harrach", "Bir Mourad Raïs", "Kouba", "Hydra", "Chéraga", "Dar El Beïda", "Rouiba", "Zéralda", "Draria", "Birtouta", "Baraki", "Bordj El Kiffan"] },
  { code: 17, name: "Djelfa", zone: 3, communes: ["Djelfa", "Messaad", "Aïn Oussera", "Hassi Bahbah"] },
  { code: 18, name: "Jijel", zone: 1, communes: ["Jijel", "Taher", "El Milia"] },
  { code: 19, name: "Sétif", zone: 2, communes: ["Sétif", "El Eulma", "Aïn Oulmène", "Bougaâ"] },
  { code: 20, name: "Saïda", zone: 2, communes: ["Saïda", "El Hassasna", "Aïn El Hadjar"] },
  { code: 21, name: "Skikda", zone: 1, communes: ["Skikda", "Azzaba", "Collo", "El Harrouch"] },
  { code: 22, name: "Sidi Bel Abbès", zone: 2, communes: ["Sidi Bel Abbès", "Telagh", "Sfisef"] },
  { code: 23, name: "Annaba", zone: 1, communes: ["Annaba", "El Bouni", "El Hadjar", "Berrahal"] },
  { code: 24, name: "Guelma", zone: 2, communes: ["Guelma", "Oued Zenati", "Bouchegouf"] },
  { code: 25, name: "Constantine", zone: 1, communes: ["Constantine", "El Khroub", "Aïn Smara", "Didouche Mourad", "Zighoud Youcef"] },
  { code: 26, name: "Médéa", zone: 1, communes: ["Médéa", "Berrouaghia", "Ksar El Boukhari", "Tablat"] },
  { code: 27, name: "Mostaganem", zone: 1, communes: ["Mostaganem", "Aïn Nouissy", "Sidi Ali", "Hassi Mameche"] },
  { code: 28, name: "M'Sila", zone: 2, communes: ["M'Sila", "Bou Saâda", "Sidi Aïssa", "Magra"] },
  { code: 29, name: "Mascara", zone: 2, communes: ["Mascara", "Sig", "Mohammadia", "Tighennif"] },
  { code: 30, name: "Ouargla", zone: 3, communes: ["Ouargla", "Hassi Messaoud", "Rouissat"] },
  { code: 31, name: "Oran", zone: 1, communes: ["Oran", "Bir El Djir", "Es Sénia", "Arzew", "Aïn El Turk", "Gdyel"] },
  { code: 32, name: "El Bayadh", zone: 3, communes: ["El Bayadh", "Bougtoub", "Brezina"] },
  { code: 33, name: "Illizi", zone: 4, communes: ["Illizi", "In Aménas"] },
  { code: 34, name: "Bordj Bou Arreridj", zone: 2, communes: ["Bordj Bou Arreridj", "Ras El Oued", "Medjana"] },
  { code: 35, name: "Boumerdès", zone: 1, communes: ["Boumerdès", "Boudouaou", "Bordj Menaïel", "Dellys", "Khemis El Khechna"] },
  { code: 36, name: "El Tarf", zone: 2, communes: ["El Tarf", "El Kala", "Dréan", "Ben M'Hidi"] },
  { code: 37, name: "Tindouf", zone: 4, communes: ["Tindouf", "Oum El Assel"] },
  { code: 38, name: "Tissemsilt", zone: 2, communes: ["Tissemsilt", "Theniet El Had", "Bordj Bou Naama"] },
  { code: 39, name: "El Oued", zone: 3, communes: ["El Oued", "Guemar", "Debila", "Robbah"] },
  { code: 40, name: "Khenchela", zone: 2, communes: ["Khenchela", "Kais", "Chechar"] },
  { code: 41, name: "Souk Ahras", zone: 2, communes: ["Souk Ahras", "Sedrata", "M'daourouch"] },
  { code: 42, name: "Tipaza", zone: 1, communes: ["Tipaza", "Koléa", "Cherchell", "Hadjout", "Fouka"] },
  { code: 43, name: "Mila", zone: 2, communes: ["Mila", "Chelghoum Laïd", "Ferdjioua", "Tadjenanet"] },
  { code: 44, name: "Aïn Defla", zone: 1, communes: ["Aïn Defla", "Khemis Miliana", "El Attaf", "Miliana"] },
  { code: 45, name: "Naâma", zone: 3, communes: ["Naâma", "Mécheria", "Aïn Sefra"] },
  { code: 46, name: "Aïn Témouchent", zone: 2, communes: ["Aïn Témouchent", "Hammam Bou Hadjar", "Béni Saf", "El Malah"] },
  { code: 47, name: "Ghardaïa", zone: 3, communes: ["Ghardaïa", "Metlili", "El Guerrara", "Berriane"] },
  { code: 48, name: "Relizane", zone: 2, communes: ["Relizane", "Oued Rhiou", "Mazouna", "Zemmora"] },
  { code: 49, name: "Timimoun", zone: 4, communes: ["Timimoun", "Aougrout", "Charouine"] },
  { code: 50, name: "Bordj Badji Mokhtar", zone: 4, communes: ["Bordj Badji Mokhtar", "Timiaouine"] },
  { code: 51, name: "Ouled Djellal", zone: 3, communes: ["Ouled Djellal", "Sidi Khaled", "Doucen"] },
  { code: 52, name: "Béni Abbès", zone: 4, communes: ["Béni Abbès", "Igli", "Kerzaz"] },
  { code: 53, name: "In Salah", zone: 4, communes: ["In Salah", "In Ghar", "Foggaret Ezzaouia"] },
  { code: 54, name: "In Guezzam", zone: 4, communes: ["In Guezzam", "Tin Zaouatine"] },
  { code: 55, name: "Touggourt", zone: 3, communes: ["Touggourt", "Nezla", "Zaouia El Abidia", "Témacine"] },
  { code: 56, name: "Djanet", zone: 4, communes: ["Djanet", "Bordj El Haouas"] },
  { code: 57, name: "El M'Ghair", zone: 3, communes: ["El M'Ghair", "Djamaa", "Sidi Amrane"] },
  { code: 58, name: "El Meniaa", zone: 4, communes: ["El Meniaa", "Hassi Gara", "Mansourah"] },
];

/**
 * Fallback delivery pricing per zone (DZD).
 * Real prices come from the Delivery table (per courier per wilaya),
 * seeded from this grid and editable by the admin.
 */
export const ZONE_FEES: Record<number, { home: number; desk: number }> = {
  1: { home: 500, desk: 350 },
  2: { home: 650, desk: 450 },
  3: { home: 850, desk: 600 },
  4: { home: 1200, desk: 900 },
};

export const PRODUCT_CATEGORIES = [
  "Robes",
  "Kaftans",
  "Hijabs",
  "Abayas",
  "Chemises",
  "Pantalons",
  "Vestes",
  "Chaussures",
  "Sacs",
  "Accessoires",
  "Enfants",
  "Sport",
] as const;
