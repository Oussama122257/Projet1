import { aiAvailable, jsonCompletion } from "./openai";

export interface DescribeInput {
  name: string;
  category: string;
  sizes?: string[];
  colors?: string[];
  price?: number;
  keywords?: string;
}

export interface DescribeResult {
  title: string;
  description: string; // persuasive French copy
  descriptionAr: string; // Arabic version
  bullets: string[];
  metaTags: string[];
}

/**
 * "Générer avec IA" — writes a persuasive bilingual (FR/AR) product listing
 * from name + attributes. Sellers in Algeria sell to a bilingual audience;
 * both languages boost conversion and SEO.
 */
export async function generateDescription(input: DescribeInput): Promise<DescribeResult> {
  if (!aiAvailable()) {
    // Deterministic fallback so the button still works without an API key.
    return {
      title: input.name,
      description: `${input.name} — ${input.category} de qualité premium. ${
        input.colors?.length ? `Disponible en ${input.colors.join(", ")}. ` : ""
      }${input.sizes?.length ? `Tailles: ${input.sizes.join(", ")}. ` : ""}Livraison dans les 58 wilayas, paiement à la livraison.`,
      descriptionAr: `${input.name} — جودة ممتازة. التوصيل متوفر لكل الولايات، الدفع عند الاستلام.`,
      bullets: [
        "Qualité premium vérifiée",
        "Paiement à la livraison (COD)",
        "Livraison 58 wilayas",
      ],
      metaTags: [input.category.toLowerCase(), "algérie", "mode", "cod"],
    };
  }

  const system = `Tu es le copywriter e-commerce de Zeem.dz, marketplace de mode algérienne.
Écris des fiches produit qui convertissent pour un public algérien (français + arabe).
Mets en avant: qualité, paiement à la livraison (COD), livraison 58 wilayas.
Réponds en JSON: {"title": string, "description": string (120-200 mots, français),
"descriptionAr": string (arabe, 60-100 mots), "bullets": string[4-6], "metaTags": string[5-8]}`;

  const user = JSON.stringify({
    nom: input.name,
    categorie: input.category,
    tailles: input.sizes,
    couleurs: input.colors,
    prix_dzd: input.price,
    mots_cles: input.keywords,
  });

  return jsonCompletion<DescribeResult>(system, user);
}
