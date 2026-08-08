"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "bot";
  text: string;
}

/**
 * Floating support chatbot (RAG over FAQ + live order status by reference).
 * Answers: delivery times, COD process, fees, tracking (ZM-XXXXXX)…
 */
export function SupportBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Salam ! 👋 Je suis l'assistant Zeem. Posez-moi vos questions sur la livraison, le paiement à la livraison, ou donnez-moi votre référence de commande (ZM-XXXXXX).",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      return (await res.json()) as { answer: string };
    },
    onSuccess: (data) => {
      setMessages((m) => [...m, { role: "bot", text: data.answer }]);
      setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    },
  });

  const send = () => {
    const text = input.trim();
    if (!text || ask.isPending) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    ask.mutate(text);
    setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy-800 shadow-gold transition-transform hover:scale-105"
        aria-label="Assistance Zeem"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-5 z-50 flex h-[440px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border bg-white shadow-glass"
          >
            <div className="bg-navy-700 px-4 py-3 text-white">
              <p className="font-bold">Assistant Zeem 🤖</p>
              <p className="text-xs text-navy-100">Réponses instantanées, 24h/7j</p>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-gold text-navy-800"
                      : "bg-muted text-navy-700"
                  )}
                >
                  {m.text}
                </div>
              ))}
              {ask.isPending && (
                <div className="max-w-[85%] rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Je réfléchis…
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t p-3">
              <input
                className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                placeholder="Votre question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <button
                onClick={send}
                className="rounded-xl bg-navy-700 p-2 text-white hover:bg-navy-600"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
