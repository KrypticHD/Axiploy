// Shared email sending utility using Resend

export async function sendEmail({
  to,
  subject,
  html,
  from = "Axiploy <hello@axiploy.com.au>",
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  if (!process.env.RESEND_API_KEY) return { ok: false, error: "No RESEND_API_KEY" };
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from, to, subject, html });
  return { ok: !error, error: error?.message };
}

// Shared dark-mode email wrapper — matches Axiploy brand
export function emailWrapper(content: string, preview?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${preview ? `<meta name="x-apple-disable-message-reformatting" />` : ""}
<title>Axiploy</title>
<style>
  body { margin:0; padding:0; background:#0a0a14; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#e2e8f0; }
  .wrap { max-width:580px; margin:0 auto; padding:32px 16px; }
  .logo { font-size:20px; font-weight:700; color:#fff; letter-spacing:-0.5px; margin-bottom:32px; }
  .logo span { color:#3b82f6; }
  .card { background:#13131f; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:28px; margin-bottom:16px; }
  .heading { font-size:22px; font-weight:700; color:#fff; margin:0 0 8px 0; }
  .sub { font-size:14px; color:#94a3b8; margin:0 0 24px 0; }
  .stat-row { display:flex; gap:12px; margin:16px 0; }
  .stat { flex:1; background:#0d0d1a; border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:16px; text-align:center; }
  .stat-val { font-size:24px; font-weight:700; color:#fff; }
  .stat-lbl { font-size:11px; color:#64748b; margin-top:4px; }
  .section-title { font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.08em; margin:20px 0 10px; }
  .item { padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:13px; color:#cbd5e1; display:flex; gap:8px; align-items:flex-start; }
  .item:last-child { border-bottom:none; }
  .dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; margin-top:5px; }
  .dot-red { background:#ef4444; }
  .dot-amber { background:#f59e0b; }
  .dot-blue { background:#3b82f6; }
  .dot-green { background:#10b981; }
  .dot-grey { background:#475569; }
  .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10px; font-weight:600; }
  .badge-urgent { background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .badge-important { background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.2); }
  .badge-fyi { background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.2); }
  .btn { display:inline-block; padding:12px 24px; background:#3b82f6; color:#fff !important; border-radius:10px; text-decoration:none; font-size:14px; font-weight:600; margin-top:20px; }
  .footer { text-align:center; font-size:11px; color:#334155; padding-top:24px; }
  p { margin:8px 0; font-size:14px; line-height:1.6; color:#94a3b8; }
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">Axi<span>ploy</span></div>
  ${content}
  <div class="footer">
    Axiploy · AI Workforce Platform<br />
    You're receiving this because you have an active Axiploy subscription.
  </div>
</div>
</body>
</html>`;
}
