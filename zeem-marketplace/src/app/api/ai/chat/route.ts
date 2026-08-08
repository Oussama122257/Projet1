import { NextResponse } from "next/server";
import { z } from "zod";
import { answerSupportQuestion } from "@/lib/ai/chatbot";

const schema = z.object({ message: z.string().min(1).max(1000) });

/** POST /api/ai/chat — buyer support chatbot (RAG over FAQ + live orders). */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Message requis." }, { status: 400 });

  try {
    const answer = await answerSupportQuestion(parsed.data.message);
    return NextResponse.json({ answer });
  } catch (e) {
    console.error("chatbot failed", e);
    return NextResponse.json(
      { answer: "Désolé, je rencontre un problème. Écrivez-nous à support@zeem.dz." },
      { status: 200 }
    );
  }
}
