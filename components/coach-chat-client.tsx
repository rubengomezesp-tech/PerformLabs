"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function renderMd(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[^]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br />");
}

export function CoachChatClient({
  greeting,
  initialMessages,
  hint,
}: {
  greeting: string;
  initialMessages: ChatMessage[];
  hint: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  async function send() {
    const q = input.trim();
    if (!q || streaming) return;

    setInput("");
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: q }]);
    setStreaming(true);
    setStreamText("");

    try {
      const res = await fetch("/api/coach-ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok || !res.body) throw new Error("stream_error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: full }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "El asistente no está disponible ahora mismo. Inténtalo en un momento." },
      ]);
    } finally {
      setStreamText("");
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="span12 coachChat">
      <div className="coachChatThread" role="log" aria-live="polite" aria-label="Conversación con el asistente">
        <div className="coachChatRow assistant">
          <span className="coachChatAvatar" aria-hidden="true"><Sparkles size={16} /></span>
          <div className="coachChatBubble">{greeting}</div>
        </div>

        {messages.map((msg) => (
          <div className={msg.role === "user" ? "coachChatRow user" : "coachChatRow assistant"} key={msg.id}>
            {msg.role === "assistant" && (
              <span className="coachChatAvatar" aria-hidden="true"><Sparkles size={16} /></span>
            )}
            {msg.role === "assistant" ? (
              <div className="coachChatBubble" dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
            ) : (
              <div className="coachChatBubble">{msg.content}</div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="coachChatRow assistant" aria-label="El asistente está respondiendo">
            <span className="coachChatAvatar" aria-hidden="true"><Sparkles size={16} /></span>
            {streamText ? (
              <div className="coachChatBubble coachChatStreaming" dangerouslySetInnerHTML={{ __html: renderMd(streamText) }} />
            ) : (
              <div className="coachChatBubble">
                <span className="coachChatDots" aria-hidden="true"><span /><span /><span /></span>
              </div>
            )}
          </div>
        )}

        <div ref={endRef} aria-hidden="true" />
      </div>

      <div className="coachChatComposer">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Pregunta lo que necesites…"
          disabled={streaming}
          autoComplete="off"
          maxLength={1000}
          aria-label="Escribe tu pregunta al asistente"
        />
        <button
          className="btn primary"
          onClick={send}
          disabled={streaming || !input.trim()}
          type="button"
          aria-label="Enviar mensaje"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="coachChatHint">{hint}</p>
    </div>
  );
}
