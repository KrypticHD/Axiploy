import type { AskResponse } from "./types";
import {
  MOCK_METRICS,
  MOCK_ACTIVITY,
  MOCK_ONBOARDING,
  MOCK_APPROVALS,
  MOCK_REPORTS,
  MOCK_DIGITAL_EMPLOYEES,
  MOCK_USER,
} from "./mock-data";

function match(msg: string, ...keywords: string[]): boolean {
  const lower = msg.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-AU", { day: "numeric", month: "long" });
}

type IntentMeta = { confidence: number; sources: string[] };

const INTENT_META: Record<string, IntentMeta> = {
  today:     { confidence: 94, sources: ["Activity log", "Dashboard metrics"] },
  week:      { confidence: 91, sources: ["Weekly report", "Activity log"] },
  docs:      { confidence: 97, sources: ["Onboarding records", "Document tracker"] },
  starting:  { confidence: 96, sources: ["Onboarding records", "Start date schedule"] },
  risk:      { confidence: 95, sources: ["Onboarding records", "Risk assessment engine"] },
  hours:     { confidence: 92, sources: ["Dashboard metrics", "Monthly report"] },
  approvals: { confidence: 99, sources: ["Approvals queue"] },
  reports:   { confidence: 90, sources: ["Reports library"] },
  onboarding:{ confidence: 93, sources: ["Onboarding records", "Dashboard metrics"] },
  busy:      { confidence: 88, sources: ["Digital Employee stats", "Activity log"] },
  focus:     { confidence: 85, sources: ["Approvals queue", "Risk assessment", "Onboarding records"] },
  reminder:  { confidence: 90, sources: ["Onboarding records", "Email queue"] },
  approve:   { confidence: 99, sources: ["Approvals queue"] },
  activity:  { confidence: 93, sources: ["Activity log"] },
  workforce: { confidence: 96, sources: ["Digital Employee records"] },
  default:   { confidence: 78, sources: ["Dashboard metrics", "Activity log"] },
};

function withMeta(response: AskResponse, intent: string): AskResponse {
  const meta = INTENT_META[intent] ?? INTENT_META.default;
  return { ...response, confidence: meta.confidence, sources: meta.sources };
}

export function askEngine(message: string): AskResponse {
  const msg = message.trim();

  // ── TODAY / WHAT DID THEY DO ──────────────────────────────────────────────
  if (match(msg, "today", "this morning", "done today", "what did", "what have", "achieved")) {
    const successes = MOCK_ACTIVITY.filter((a) => a.status === "success").length;
    const warnings = MOCK_ACTIVITY.filter((a) => a.status === "warning").length;
    const recentActions = MOCK_ACTIVITY.slice(0, 5).map((a) => a.action);
    return withMeta({
      text: `Today your AI workforce at ${MOCK_USER.clientName} has been working across all three Digital Employees. Here's a summary of activity so far:`,
      bullets: recentActions,
      metrics: [
        { label: "Tasks completed", value: String(MOCK_METRICS.tasksCompleted) },
        { label: "Hours saved (month)", value: `${MOCK_METRICS.hoursSaved}h` },
        { label: "Successful actions", value: String(successes) },
        { label: "Items flagged", value: String(warnings) },
      ],
      followUp: warnings > 0
        ? `${warnings} items have been flagged and may need your attention. Would you like me to show you the details?`
        : "No failed workflows detected. All systems running normally.",
      actions: [
        { label: "View Activity Feed", href: "/portal/activity" },
        { label: "View Approvals", href: "/portal/approvals" },
      ],
    }, "today");
  }

  // ── THIS WEEK ────────────────────────────────────────────────────────────
  if (match(msg, "this week", "week", "weekly")) {
    const weekly = MOCK_REPORTS.find((r) => r.type.toLowerCase().includes("weekly"));
    if (weekly) {
      return withMeta({
        text: `Here is your weekly summary for ${weekly.period}:`,
        bullets: weekly.summary.highlights,
        metrics: [
          { label: "Tasks completed", value: String(weekly.summary.tasksCompleted) },
          { label: "Hours saved", value: `${weekly.summary.hoursSaved}h` },
          { label: "Issues flagged", value: String(weekly.summary.issuesFlagged) },
          { label: "Outstanding items", value: String(weekly.summary.outstandingItems) },
        ],
        actions: [{ label: "View Full Report", href: "/portal/reports" }],
        followUp: "Would you like me to generate an email version of this report for your team?",
      }, "week");
    }
  }

  // ── MISSING DOCUMENTS / OVERDUE ──────────────────────────────────────────
  if (match(msg, "missing document", "documents", "overdue", "outstanding document", "paperwork")) {
    const withMissing = MOCK_ONBOARDING.filter((e) => e.missingDocuments > 0);
    const totalMissing = withMissing.reduce((acc, e) => acc + e.missingDocuments, 0);
    return withMeta({
      text: `There are currently ${totalMissing} missing documents across ${withMissing.length} active onboardings:`,
      bullets: withMissing.map(
        (e) => `${e.employeeName} — ${e.missingDocuments} document${e.missingDocuments > 1 ? "s" : ""} missing (${e.riskLevel} risk, starts ${fmt(e.startDate)})`
      ),
      actions: [
        { label: "View Onboarding", href: "/portal/onboarding" },
        { label: "View Approvals", href: "/portal/approvals" },
      ],
      followUp: "Would you like me to send reminder emails to all employees with outstanding documents?",
    }, "docs");
  }

  // ── STARTING SOON / NEXT WEEK ────────────────────────────────────────────
  if (match(msg, "starting", "start date", "next week", "monday", "due to start", "starting soon")) {
    const now = new Date();
    const soon = MOCK_ONBOARDING.filter((e) => {
      const diff = (new Date(e.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    });
    if (soon.length === 0) {
      return withMeta({ text: "There are no employees due to start in the next 14 days." }, "starting");
    }
    return withMeta({
      text: `${soon.length} employee${soon.length > 1 ? "s are" : " is"} due to start within the next two weeks:`,
      bullets: soon.map(
        (e) => `${e.employeeName} — ${e.role} — starts ${fmt(e.startDate)} — ${e.riskLevel} risk — ${e.missingDocuments} doc${e.missingDocuments !== 1 ? "s" : ""} missing`
      ),
      actions: [{ label: "View Onboarding Dashboard", href: "/portal/onboarding" }],
      followUp: soon.some((e) => ["High", "Critical"].includes(e.riskLevel))
        ? "Warning: one or more employees starting soon are flagged as high or critical risk. Immediate action is recommended."
        : undefined,
    }, "starting");
  }

  // ── RISK / HIGH RISK / CRITICAL ──────────────────────────────────────────
  if (match(msg, "risk", "at risk", "high risk", "critical", "danger", "urgent")) {
    const atRisk = MOCK_ONBOARDING.filter((e) => ["High", "Critical"].includes(e.riskLevel));
    return withMeta({
      text: `There are currently ${atRisk.length} onboarding ${atRisk.length === 1 ? "case" : "cases"} flagged as high or critical risk:`,
      bullets: atRisk.map(
        (e) => `${e.employeeName} (${e.riskLevel}) — starts ${fmt(e.startDate)} — ${e.missingDocuments} document${e.missingDocuments !== 1 ? "s" : ""} outstanding — ${e.nextAction}`
      ),
      metrics: [
        { label: "High risk", value: String(atRisk.filter((e) => e.riskLevel === "High").length) },
        { label: "Critical", value: String(atRisk.filter((e) => e.riskLevel === "Critical").length) },
      ],
      actions: [
        { label: "View At-Risk Employees", href: "/portal/onboarding" },
        { label: "View Approvals", href: "/portal/approvals" },
      ],
      followUp: "I recommend addressing critical risk cases immediately. Would you like me to draft escalation emails to their managers?",
    }, "risk");
  }

  // ── HOURS SAVED / TIME SAVED ─────────────────────────────────────────────
  if (match(msg, "hours saved", "time saved", "efficiency", "how much time", "how many hours")) {
    const monthly = MOCK_REPORTS.find((r) => r.type.toLowerCase().includes("monthly"));
    return withMeta({
      text: `Your AI workforce has saved ${MOCK_USER.clientName} significant time this month. Here is the breakdown:`,
      metrics: [
        { label: "Hours saved this month", value: `${MOCK_METRICS.hoursSaved}h` },
        { label: "Estimated annual saving", value: `~${MOCK_METRICS.hoursSaved * 12}h` },
        { label: "Tasks automated", value: String(MOCK_METRICS.tasksCompleted) },
        { label: "Avg hrs/week saved", value: `${Math.round(MOCK_METRICS.hoursSaved / 4)}h` },
      ],
      bullets: [
        `AI Onboarding Assistant: ~${Math.round(MOCK_METRICS.hoursSaved * 0.5)}h saved on document chasing and inductions`,
        `AI Admin Assistant: ~${Math.round(MOCK_METRICS.hoursSaved * 0.3)}h saved on email processing and reporting`,
        `AI Growth Assistant: ~${Math.round(MOCK_METRICS.hoursSaved * 0.2)}h saved on lead follow-up and pipeline management`,
      ],
      followUp: monthly
        ? `At this rate, your AI workforce will save approximately ${MOCK_METRICS.hoursSaved * 12} hours across the full year — the equivalent of roughly ${Math.round((MOCK_METRICS.hoursSaved * 12) / 8)} full working days.`
        : undefined,
      actions: [{ label: "View Monthly Report", href: "/portal/reports" }],
    }, "hours");
  }

  // ── APPROVALS / PENDING ──────────────────────────────────────────────────
  if (match(msg, "approval", "pending", "outstanding", "waiting", "need to approve", "review")) {
    const pending = MOCK_APPROVALS.filter((a) => a.status === "pending");
    return withMeta({
      text: `There are currently ${pending.length} items awaiting your approval across your AI workforce:`,
      bullets: pending.map(
        (a) => `${a.actionType} — ${a.digitalEmployee} — relates to ${a.relatedPerson}${a.relatedBusiness ? ` (${a.relatedBusiness})` : ""}`
      ),
      metrics: [{ label: "Pending approvals", value: String(pending.length) }],
      actions: [{ label: "Go to Approvals Centre", href: "/portal/approvals" }],
      followUp: "Would you like me to approve all low-risk requests automatically, or would you prefer to review each one individually?",
    }, "approvals");
  }

  // ── REPORTS / GENERATE REPORT ────────────────────────────────────────────
  if (match(msg, "report", "summary", "generate", "create report", "monthly", "performance")) {
    const latest = MOCK_REPORTS[0];
    return withMeta({
      text: `Here is a summary from your latest report — ${latest.type} for ${latest.period}:`,
      bullets: latest.summary.highlights,
      metrics: [
        { label: "Tasks completed", value: String(latest.summary.tasksCompleted) },
        { label: "Hours saved", value: `${latest.summary.hoursSaved}h` },
        { label: "Issues flagged", value: String(latest.summary.issuesFlagged) },
        { label: "Actions taken", value: String(latest.summary.actionsTaken) },
      ],
      actions: [{ label: "View All Reports", href: "/portal/reports" }],
      followUp: "I can also generate a weekly report, growth report or onboarding-specific report. Just ask.",
    }, "reports");
  }

  // ── ONBOARDING / EMPLOYEES / PROGRESS ───────────────────────────────────
  if (match(msg, "onboarding", "employees", "progress", "new starters", "new hire")) {
    const byStatus: Record<string, number> = {};
    MOCK_ONBOARDING.forEach((e) => {
      byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    });
    const statusLines = Object.entries(byStatus).map(([s, n]) => `${n} × ${s}`);
    const atRisk = MOCK_ONBOARDING.filter((e) => ["High", "Critical"].includes(e.riskLevel));
    return withMeta({
      text: `Here is the current onboarding snapshot across ${MOCK_ONBOARDING.length} active employees:`,
      bullets: statusLines,
      metrics: [
        { label: "Total active", value: String(MOCK_ONBOARDING.length) },
        { label: "At risk", value: String(atRisk.length) },
        { label: "Missing docs", value: String(MOCK_ONBOARDING.reduce((a, e) => a + e.missingDocuments, 0)) },
      ],
      actions: [
        { label: "View Onboarding Dashboard", href: "/portal/onboarding" },
        { label: "Add New Employee", href: "/portal/forms/new-employee" },
      ],
      followUp: atRisk.length > 0
        ? `${atRisk.length} employee${atRisk.length > 1 ? "s are" : " is"} currently flagged as high or critical risk. Would you like details?`
        : undefined,
    }, "onboarding");
  }

  // ── BUSIEST / MOST ACTIVE DIGITAL EMPLOYEE ───────────────────────────────
  if (match(msg, "busy", "busiest", "most active", "which employee", "which ai", "working hardest")) {
    return withMeta({
      text: "Here is a comparison of activity across your three Digital Employees this month:",
      bullets: MOCK_DIGITAL_EMPLOYEES.map(
        (de) => `${de.name}: ${de.stats.map((s) => `${s.value} ${s.label}`).join(", ")}`
      ),
      followUp: "The AI Onboarding Assistant is currently managing the most complex workload with 12 active onboardings, including 2 high-risk cases.",
      actions: [{ label: "View AI Workforce", href: "/portal/workforce" }],
    }, "busy");
  }

  // ── FOCUS / RECOMMENDATIONS / WHAT SHOULD I DO ──────────────────────────
  if (match(msg, "focus", "recommend", "what should", "priority", "most important", "action")) {
    const critical = MOCK_ONBOARDING.filter((e) => e.riskLevel === "Critical");
    const pendingApprovals = MOCK_APPROVALS.filter((a) => a.status === "pending");
    const startingSoon = MOCK_ONBOARDING.filter((e) => {
      const diff = (new Date(e.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    });
    const recommendations: string[] = [];
    if (critical.length > 0)
      recommendations.push(`🔴 CRITICAL: ${critical.map((e) => e.employeeName).join(", ")} — ${critical[0].nextAction}`);
    if (startingSoon.length > 0)
      recommendations.push(`🟡 URGENT: ${startingSoon.map((e) => e.employeeName).join(", ")} start${startingSoon.length === 1 ? "s" : ""} within 3 days — verify documents immediately`);
    if (pendingApprovals.length > 0)
      recommendations.push(`🔵 ACTION NEEDED: ${pendingApprovals.length} approval${pendingApprovals.length > 1 ? "s" : ""} awaiting your review — your AI employees are waiting to proceed`);
    recommendations.push("✅ All other workflows running normally — no immediate action required");
    return withMeta({
      text: `Based on current data, here are my top priorities for you today at ${MOCK_USER.clientName}:`,
      bullets: recommendations,
      actions: [
        { label: "View Approvals", href: "/portal/approvals" },
        { label: "View At-Risk Employees", href: "/portal/onboarding" },
      ],
      followUp: "Would you like me to take any of these actions on your behalf?",
    }, "focus");
  }

  // ── SEND REMINDER / EXECUTE ACTIONS ─────────────────────────────────────
  if (match(msg, "send reminder", "remind", "chase", "follow up", "follow-up")) {
    const withMissing = MOCK_ONBOARDING.filter((e) => e.missingDocuments > 0);
    return withMeta({
      text: `I can send reminder emails to ${withMissing.length} employees with outstanding documents. Here's who would receive them:`,
      bullets: withMissing.map((e) => `${e.employeeName} — ${e.missingDocuments} document${e.missingDocuments !== 1 ? "s" : ""} outstanding`),
      followUp: "To send these reminders, go to the Approvals Centre and approve the queued reminder actions, or I can escalate each case directly.",
      actions: [{ label: "Go to Approvals", href: "/portal/approvals" }],
    }, "reminder");
  }

  if (match(msg, "approve all", "approve low", "bulk approve")) {
    return withMeta({
      text: "To protect your business, I recommend reviewing approvals individually rather than bulk-approving. However, I can highlight which ones are low-risk for quick review.",
      bullets: MOCK_APPROVALS.filter((a) => a.status === "pending").map(
        (a) => `${a.actionType} — ${a.relatedPerson} — ${a.digitalEmployee}`
      ),
      actions: [{ label: "Review Approvals", href: "/portal/approvals" }],
      followUp: "Head to the Approvals Centre to quickly action these. Most should take less than 30 seconds each.",
    }, "approve");
  }

  // ── ACTIVITY / WHAT HAPPENED ─────────────────────────────────────────────
  if (match(msg, "activity", "happened", "log", "recent", "latest")) {
    return withMeta({
      text: "Here is the latest activity from your AI workforce:",
      bullets: MOCK_ACTIVITY.slice(0, 6).map((a) => `[${a.digitalEmployee}] ${a.action} — ${a.result}`),
      actions: [{ label: "View Full Activity Feed", href: "/portal/activity" }],
    }, "activity");
  }

  // ── WORKFORCE / DIGITAL EMPLOYEES ────────────────────────────────────────
  if (match(msg, "workforce", "digital employee", "active", "how many employees", "how many ai")) {
    return withMeta({
      text: `${MOCK_USER.clientName} currently has ${MOCK_DIGITAL_EMPLOYEES.length} active Digital Employees:`,
      bullets: MOCK_DIGITAL_EMPLOYEES.map((de) => `${de.name} — Status: ${de.status} — ${de.stats[0].value} ${de.stats[0].label}`),
      metrics: [{ label: "Active Digital Employees", value: String(MOCK_METRICS.activeEmployees) }],
      actions: [{ label: "View AI Workforce", href: "/portal/workforce" }],
    }, "workforce");
  }

  // ── DEFAULT FALLBACK ─────────────────────────────────────────────────────
  return withMeta({
    text: `Here's a quick snapshot of your AI workforce at ${MOCK_USER.clientName} right now:`,
    bullets: [
      `${MOCK_METRICS.activeEmployees} Digital Employees active`,
      `${MOCK_METRICS.tasksCompleted} tasks completed this month`,
      `${MOCK_METRICS.hoursSaved} hours saved this month`,
      `${MOCK_METRICS.pendingApprovals} approvals awaiting your review`,
      `${MOCK_METRICS.highRiskItems} high-risk onboarding cases`,
    ],
    metrics: [
      { label: "Tasks completed", value: String(MOCK_METRICS.tasksCompleted) },
      { label: "Hours saved", value: `${MOCK_METRICS.hoursSaved}h` },
    ],
    actions: [
      { label: "View Dashboard", href: "/portal/dashboard" },
      { label: "View Approvals", href: "/portal/approvals" },
    ],
    followUp: "You can ask me anything — try 'What should I focus on today?' or 'Which employees are at risk?'",
  }, "default");
}
