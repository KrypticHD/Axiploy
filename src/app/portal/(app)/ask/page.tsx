"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RotateCcw, Plus, MessageSquare, Trash2, Clock, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "axiploy_ask_history";
const MAX_CONVERSATIONS = 30;

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, MAX_CONVERSATIONS))); } catch {}
}

function titleFromMessage(text: string): string {
  return text.length > 50 ? text.slice(0, 50).trim() + "…" : text;
}

function timeLabel(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function AskAxiployPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const convs = loadConversations();
    setConversations(convs);
    if (convs.length > 0) {
      setActiveId(convs[0].id);
      setMessages(convs[0].messages);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function selectConversation(conv: Conversation) {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    saveConversations(updated);
    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        setActiveId(null);
        setMessages([]);
      }
    }
  }

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    let assistantMsg: Message;
    try {
      const res = await fetch("/api/portal/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      assistantMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response?.text ?? "I couldn't process that request.",
        response: data.response,
      };
    } catch {
      assistantMsg = { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong. Please try again." };
    }

    const finalMessages = [...nextMessages, assistantMsg];
    setMessages(finalMessages);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);

    // Persist to localStorage
    setConversations((prev) => {
      const now = Date.now();
      let updated: Conversation[];
      if (activeId) {
        updated = prev.map((c) => c.id === activeId ? { ...c, messages: finalMessages, updatedAt: now } : c);
      } else {
        const newConv: Conversation = {
          id: crypto.randomUUID(),
          title: titleFromMessage(trimmed),
          messages: finalMessages,
          createdAt: now,
          updatedAt: now,
        };
        setActiveId(newConv.id);
        updated = [newConv, ...prev];
      }
      // Sort by most recent
      updated = [...updated].sort((a, b) => b.updatedAt - a.updatedAt);
      saveConversations(updated);
      return updated;
    });
  }, [loading, messages, activeId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-4rem)] -m-5 lg:-m-7">

      {/* History sidebar */}
      <div className={`hidden lg:flex flex-col shrink-0 border-r border-white/[0.06] bg-surface/50 transition-all duration-300 ${historyOpen ? "w-60" : "w-12"}`}>
        <div className={`flex items-center border-b border-white/[0.06] py-3 ${historyOpen ? "justify-between px-4" : "justify-center px-0"}`}>
          {historyOpen && <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">History</p>}
          <div className={`flex items-center gap-1 ${historyOpen ? "" : "flex-col gap-2"}`}>
            {historyOpen && (
              <button onClick={newChat} title="New chat" className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors">
                <Plus size={14} />
              </button>
            )}
            <button onClick={() => setHistoryOpen((v) => !v)} title={historyOpen ? "Collapse history" : "Open history"} className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors">
              {historyOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </button>
          </div>
        </div>

        {historyOpen && (
          <div className="flex-1 overflow-y-auto py-2">
            {conversations.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Clock size={16} className="text-text-muted/30 mx-auto mb-2" />
                <p className="text-text-muted/50 text-xs">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`group w-full text-left px-4 py-3 flex items-start gap-2 transition-colors hover:bg-white/[0.04] ${activeId === conv.id ? "bg-accent-blue/10 border-r-2 border-accent-blue" : ""}`}
                >
                  <MessageSquare size={13} className={`mt-0.5 flex-shrink-0 ${activeId === conv.id ? "text-accent-blue" : "text-text-muted/40"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${activeId === conv.id ? "text-accent-blue" : "text-text-muted"}`}>{conv.title}</p>
                    <p className="text-[10px] text-text-muted/40 mt-0.5">{timeLabel(conv.updatedAt)}</p>
                  </div>
                  <button onClick={(e) => deleteConversation(conv.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-muted/50 hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 size={11} />
                  </button>
                </button>
              ))
            )}
          </div>
        )}

        {!historyOpen && (
          <div className="flex-1 flex flex-col items-center py-3 gap-2 overflow-hidden">
            <button onClick={newChat} title="New chat" className="p-1.5 rounded-lg text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors">
              <Plus size={14} />
            </button>
            {conversations.slice(0, 8).map((conv) => (
              <button key={conv.id} onClick={() => { setHistoryOpen(true); selectConversation(conv); }} title={conv.title}
                className={`p-1.5 rounded-lg transition-colors ${activeId === conv.id ? "text-accent-blue bg-accent-blue/10" : "text-text-muted/40 hover:text-text-muted hover:bg-white/[0.04]"}`}>
                <MessageSquare size={13} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main chat */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Ask Axiploy</h1>
            <p className="text-xs text-text-muted mt-0.5">Your AI operations director — ask anything about your workforce</p>
          </div>
          <button
            onClick={newChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary border border-white/[0.08] hover:border-white/20 transition-colors"
          >
            <RotateCcw size={12} />
            New Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mx-auto">
                  <span className="text-2xl">⚡</span>
                </div>
                <h2 className="text-xl font-semibold text-text-primary">How can I help you today?</h2>
                <p className="text-sm text-text-muted">
                  I have full visibility across your Digital Employees, onboarding records, approvals, reports and Knowledge Base. Just ask.
                </p>
              </div>
              <SuggestedPrompts onSelect={(p) => send(p)} />
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} response={msg.response} />
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
    </div>
  );
}
