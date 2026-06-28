"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Send, Maximize2, RotateCcw } from "lucide-react";
import type { AskResponse } from "@/lib/types";
import ChatMessage from "./ChatMessage";
import SuggestedPrompts from "./SuggestedPrompts";
import TypingIndicator from "./TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AskResponse;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AskPanel({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/portal/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response?.text ?? "I couldn't process that request.",
          response: data.response,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading]);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 flex flex-col bg-[#080e1c] border-l border-white/[0.08] shadow-2xl shadow-black/40 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <p className="text-sm font-semibold text-text-primary">Ask Axiploy</p>
            <p className="text-[11px] text-text-muted">Quick chat · your AI operations director</p>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                title="New chat"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <Link
              href="/portal/ask"
              onClick={onClose}
              title="Open full screen"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
            >
              <Maximize2 size={13} />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-xs text-text-muted text-center">Ask a quick question or pick a prompt below</p>
              <SuggestedPrompts onSelect={(p) => send(p)} />
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} response={msg.response} />
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] text-accent-blue font-bold">A</span>
              </div>
              <div className="glass border border-white/[0.08] rounded-2xl rounded-tl-sm">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex-1 glass border border-white/[0.10] rounded-xl overflow-hidden focus-within:border-accent-blue/40 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); send(input); }
                }}
                placeholder="Ask anything…"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none"
              />
            </div>
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-accent-blue hover:bg-accent-blue-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
