import { db } from "@/lib/db";
import { aiAvailable, openai, AI_MODEL } from "./openai";

/**
 * Support chatbot (RAG-lite).
 * Knowledge base = curated FAQ chunks below + live order lookup when the
 * buyer provides an order reference (ZM-XXXXXX). Retrieval is keyword-scored
 * (small corpus — embeddings unnecessary); GPT writes the final answer, or a
 * template does when no API key is configured.
 */

const FAQ: Array<{ id: string; keywords: string[]; content: string }> = [
  {
    id: "cod",
    keywords: ["paiement", "cod", "cash", "payer", "livraison", "argent", "الدفع"],
    content:
      "Zeem fonctionne uniquement en paiement à la livraison (COD). Vous payez en espèces au livreur quand vous recevez votre colis. Aucune carte bancaire n'est requise.",
  },
  {
    id: "delais",
    keywords: ["délai", "delai", "temps", "quand", "arrive", "livraison", "jours", "متى"],
    content:
      "Délais moyens: 24-48h à Alger/Oran/Constantine, 2-4 jours pour les autres wilayas du nord, 4-7 jours pour le grand sud (Tamanrasset, Adrar, Illizi…).",
  },
  {
    id: "frais",
    keywords: ["frais", "prix", "coût", "cout", "combien", "tarif", "livraison"],
    content:
      "Les frais de livraison dépendent de votre wilaya: 350-500 DA au centre/nord, 600-850 DA hauts plateaux et sud proche, 900-1200 DA grand sud. Le point relais (stop-desk) est moins cher que la livraison à domicile.",
  },
  {
    id: "suivi",
    keywords: ["suivi", "suivre", "tracking", "où", "ou", "commande", "statut", "statue"],
    content:
      "Suivez votre commande sur zeem.dz/orders/VOTRE-REFERENCE (ex: ZM-8F3K2A). La référence vous est envoyée par SMS après la commande.",
  },
  {
    id: "retour",
    keywords: ["retour", "échange", "echange", "rembourse", "annuler", "annulation"],
    content:
      "Vous pouvez refuser le colis à la livraison avant de payer. Après paiement, les échanges se font directement avec le vendeur sous 48h (article non porté, étiquettes intactes).",
  },
  {
    id: "wilayas",
    keywords: ["wilaya", "région", "region", "zone", "couverture", "sud"],
    content: "Zeem livre dans les 58 wilayas d'Algérie via Yalidine, ZR Express et Algérie Poste.",
  },
  {
    id: "vendeur",
    keywords: ["vendre", "vendeur", "boutique", "magasin", "inscription", "commission"],
    content:
      "Pour vendre sur Zeem: créez un compte vendeur, renseignez votre wilaya et votre registre de commerce. La commission Zeem est de 10% par vente, versée après encaissement COD.",
  },
];

function retrieve(question: string, topK = 3): string[] {
  const q = question.toLowerCase();
  return FAQ.map((chunk) => ({
    chunk,
    score: chunk.keywords.reduce((s, kw) => s + (q.includes(kw) ? 1 : 0), 0),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.chunk.content);
}

export async function answerSupportQuestion(question: string): Promise<string> {
  // Live order lookup when the message contains a reference like ZM-8F3K2A.
  let orderContext = "";
  const refMatch = question.toUpperCase().match(/ZM-[A-Z0-9]{6}/);
  if (refMatch) {
    const order = await db.order.findUnique({
      where: { reference: refMatch[0] },
      include: { shipments: true },
    });
    if (order) {
      const shipmentStates = order.shipments.map((s) => s.status).join(", ");
      orderContext = `Commande ${order.reference}: statut ${order.status}, total ${order.totalAmount} DA, expéditions: ${shipmentStates || "en préparation"}.`;
    } else {
      orderContext = `Aucune commande trouvée avec la référence ${refMatch[0]}.`;
    }
  }

  const context = [...retrieve(question), orderContext].filter(Boolean);

  if (!aiAvailable()) {
    // No-AI fallback: return best-matching FAQ chunks directly.
    if (context.length > 0) return context.join("\n\n");
    return "Je n'ai pas trouvé de réponse. Contactez le support: support@zeem.dz ou 021 XX XX XX.";
  }

  const res = await openai().chat.completions.create({
    model: AI_MODEL,
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      {
        role: "system",
        content: `Tu es l'assistant support de Zeem.dz, marketplace de mode algérienne (paiement à la livraison uniquement).
Réponds en français simple et chaleureux (ou en arabe si le client écrit en arabe), en 2-4 phrases.
Utilise UNIQUEMENT le contexte fourni. Si le contexte ne suffit pas, oriente vers support@zeem.dz.
CONTEXTE:\n${context.join("\n---\n") || "(aucun)"}`,
      },
      { role: "user", content: question },
    ],
  });

  return res.choices[0]?.message?.content ?? "Désolé, une erreur est survenue. Réessayez.";
}
