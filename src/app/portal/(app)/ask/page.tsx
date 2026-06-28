"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw } from "lucide-react";
import type { AskResponse } from "@/lib/types";
import ChatMessage from "@/components/portal/ChatMessage";
import SuggestedPrompts from "@/components/portal/SuggestedPrompts";
import TypingIndicator from "@/components/portal/TypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AskResponse;
}

export default function AskAxiployPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
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
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response?.text ?? "I couldn't process that request.",
        response: data.response,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] -m-5 lg:-m-7">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Ask Axiploy</h1>
          <p className="text-xs text-text-muted mt-0.5">Your AI operations director — ask anything about your workforce</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary border border-white/[0.08] hover:border-white/20 transition-colors"
          >
            <RotateCcw size={12} />
            New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Welcome */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h2 className="text-xl font-semibold text-text-primary">How can I help you today?</h2>
              <p className="text-sm text-text-muted">
                I have full visibility across all your Digital Employees, onboarding records, approvals and reports.
                Just ask.
              </p>
            </div>
            <SuggestedPrompts onSelect={(p) => send(p)} />
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            response={msg.response}
          />
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base border border-white/10 flex items-center justify-center mt-0.5">
              <span className="text-xs">A</span>
            </div>
            <div className="glass border border-white/[0.08] rounded-2xl rounded-tl-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.06]">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 glass border border-white/[0.10] rounded-2xl overflow-hidden focus-within:border-accent-blue/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your AI workforce…"
              rows={1}
              className="w-full bg-transparent px-4 py-3 text-sm text-text-primary placeholder-text-muted resize-none outline-none max-h-40"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
          </div>
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-blue hover:bg-accent-blue-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
        <p className="text-center text-xs text-text-muted/50 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
