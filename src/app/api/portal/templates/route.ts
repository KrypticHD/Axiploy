import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULTS = [
  {
    template_type: "welcome",
    subject: "Welcome to {{company_name}} — Your onboarding journey starts here",
    body: `Dear {{employee_name}},

We're delighted to welcome you to {{company_name}}. Your start date is confirmed as {{start_date}}.

To complete your onboarding, please provide the following documents by {{document_deadline}}:

{{document_list}}

If you have any questions, please don't hesitate to get in touch with {{manager_name}} at {{manager_email}}.

We look forward to having you on the team.

Kind regards,
{{company_name}} HR Team`,
  },
  {
    template_type: "reminder",
    subject: "Reminder: Outstanding documents required — {{employee_name}}",
    body: `Dear {{employee_name}},

We noticed that the following documents are still outstanding for your upcoming start date of {{start_date}}:

{{missing_document_list}}

Please submit these as soon as possible to avoid any delays to your onboarding.

If you need assistance, please contact {{manager_name}}.

Kind regards,
{{company_name}} AI Onboarding Assistant`,
  },
  {
    template_type: "escalation",
    subject: "Action Required: High-risk onboarding case — {{employee_name}}",
    body: `Dear {{manager_name}},

This is an automated alert from the Axiploy AI Onboarding Assistant.

{{employee_name}} (starting {{start_date}}) has been flagged as HIGH RISK due to the following:

{{risk_reasons}}

We recommend contacting {{employee_name}} directly as soon as possible. Outstanding items: {{missing_documents}}.

Regards,
Axiploy AI Onboarding Assistant`,
  },
  {
    template_type: "completion",
    subject: "Onboarding complete — {{employee_name}} is ready to start",
    body: `Dear {{manager_name}},

Great news — {{employee_name}} has completed all onboarding requirements and is ready to start on {{start_date}}.

All required documents have been received and verified. No further action is required.

Kind regards,
Axiploy AI Onboarding Assistant`,
  },
  {
    template_type: "weekly",
    subject: "Your AI Workforce Weekly Summary — w/c {{week_start}}",
    body: `Dear {{client_name}},

Here is your AI workforce summary for the week ending {{week_end}}:

• Tasks completed: {{tasks_completed}}
• Hours saved: {{hours_saved}}
• New employees onboarded: {{new_onboardings}}
• Pending approvals: {{pending_approvals}}
• High-risk cases: {{high_risk_count}}

{{highlights}}

View your full report in the Axiploy portal.

Regards,
Axiploy AI Admin Assistant`,
  },
];

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { data: existing } = await supabase
    .from("email_templates")
    .select("*")
    .eq("client_id", session.clientId);

  if (!existing || existing.length === 0) {
    // Seed defaults
    await supabase.from("email_templates").insert(
      DEFAULTS.map((d) => ({ ...d, client_id: session.clientId }))
    );
    return NextResponse.json({ templates: DEFAULTS.map((d) => ({ ...d, client_id: session.clientId, updated_at: new Date().toISOString() })) });
  }

  return NextResponse.json({ templates: existing });
}

export async function PATCH(req: NextRequest) {
  const raw = req.cookies.get("axiploy_session")?.value;
  if (!raw) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let session: { clientId: string };
  try { session = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { template_type, subject, body } = await req.json();
  if (!template_type || !subject || !body) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("email_templates")
    .update({ subject, body, updated_at: new Date().toISOString() })
    .eq("client_id", session.clientId)
    .eq("template_type", template_type);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
