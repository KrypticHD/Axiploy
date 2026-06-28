"use client";

import Link from "next/link";
import Image from "next/image";
import type { AskResponse } from "@/lib/types";

interface Props {
  role: "user" | "assistant";
  content: string;
  response?: AskResponse;
}

export default function ChatMessage({ role, content, response }: Props) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-br-sm bg-accent-blue text-white text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-base border border-white/10 flex items-center justify-center overflow-hidden mt-0.5">
        <Image src="/logo.png" alt="Axiploy" width={28} height={28} className="object-contain scale-150" />
      </div>

      {/* Bubble */}
      <div className="flex-1 max-w-[85%] glass border border-white/[0.08] rounded-2xl rounded-tl-sm p-4 space-y-3">
        {response ? (
          <>
            {/* Opening text */}
            <p className="text-sm text-text-primary leading-relaxed">{response.text}</p>

            {/* Bullets */}
            {response.bullets && response.bullets.length > 0 && (
              <ul className="space-y-1.5">
                {response.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Metric pills */}
            {response.metrics && response.metrics.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {response.metrics.map((m, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs"
                  >
                    <span className="text-text-muted">{m.label}: </span>
                    <span className="text-accent-blue font-semibold">{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Follow-up text */}
            {response.followUp && (
              <p className="text-sm text-text-muted leading-relaxed italic border-t border-white/[0.06] pt-3">
                {response.followUp}
              </p>
            )}

            {/* Action buttons */}
            {response.actions && response.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {response.actions.map((a, i) => (
                  <Link
                    key={i}
                    href={a.href}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 hover:border-accent-blue/40 transition-colors"
                  >
                    {a.label} →
                  </Link>
                ))}
              </div>
            )}

            {/* Confidence + sources */}
            {(response.confidence !== undefined || (response.sources && response.sources.length > 0)) && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.04]">
                {response.confidence !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-blue/70"
                        style={{ width: `${response.confidence}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted/60">{response.confidence}% confidence</span>
                  </div>
                )}
                {response.sources && response.sources.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-text-muted/40">Sources:</span>
                    {response.sources.map((s, i) => (
                      <span key={i} className="text-[10px] text-text-muted/60 bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-text-primary leading-relaxed">{content}</p>
        )}
      </div>
    </div>
  );
}
