import AnimatedSection from "./AnimatedSection";
import Link from "next/link";
import { ClipboardList, UserCheck, DollarSign, TrendingUp, Users, ArrowRight, Share2, MessageSquare } from "lucide-react";

const agents = [
  {
    icon: ClipboardList,
    title: "AI Admin",
    description:
      "Manages your inbox, drafts replies, schedules meetings, prepares reports and keeps daily admin moving without you touching it.",
    href: "/services/ai-administrative-assistant",
    available: true,
  },
  {
    icon: UserCheck,
    title: "AI Onboarding",
    description:
      "Runs employee and contractor onboarding end to end — document collection, expiry checks, reminder emails and tracker updates.",
    href: "/services/ai-onboarding-assistant",
    available: true,
  },
  {
    icon: TrendingUp,
    title: "AI Growth",
    description:
      "Follows up leads, keeps your pipeline updated and makes sure no opportunity goes quiet — without manual chasing.",
    href: "/services/ai-growth-assistant",
    available: true,
  },
  {
    icon: Share2,
    title: "AI Social",
    description:
      "Turns your photos into platform-ready posts for Facebook, Instagram, LinkedIn and X — drafted, scheduled and waiting for your approval.",
    available: true,
  },
  {
    icon: DollarSign,
    title: "AI Accounts",
    description:
      "Chases invoices, reconciles payments and keeps your books current so nothing slips at end of month.",
    available: false,
  },
  {
    icon: Users,
    title: "AI Recruiter",
    description:
      "Screens candidates, coordinates interviews and keeps applicants warm through the hiring process.",
    available: false,
  },
];

export default function AgentCards() {
  return (
    <section id="agents" className="py-28">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
            The Workforce
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mt-3 mb-5">
            AI employees for real business admin
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Each AI employee is built for a specific job in your business — trained on your
            processes, working inside your existing tools.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <AnimatedSection key={agent.title} delay={i * 0.08}>
              <div className="glass rounded-2xl p-7 h-full flex flex-col group hover:border-accent-blue/25 transition-colors duration-300 border border-white/[0.08]">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue/20 to-accent-cyan/10 flex items-center justify-center">
                    <agent.icon size={22} className="text-accent-cyan" />
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      agent.available
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-white/[0.04] text-text-muted border-white/[0.08]"
                    }`}
                  >
                    {agent.available ? "Available" : "Coming soon"}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-3">
                  {agent.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed flex-1">
                  {agent.description}
                </p>
                {agent.href && (
                  <Link
                    href={agent.href}
                    className="inline-flex items-center gap-1.5 text-accent-cyan text-sm font-medium mt-5 group-hover:gap-2.5 transition-all"
                  >
                    Learn more <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Ask Axiploy — included with every workforce */}
        <AnimatedSection delay={0.2}>
          <div className="mt-8 glass rounded-2xl border border-accent-blue/20 p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-gradient-to-r from-accent-blue/[0.07] to-accent-cyan/[0.04]">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-blue/25 to-accent-cyan/15 flex items-center justify-center shrink-0">
              <MessageSquare size={22} className="text-accent-blue" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-semibold text-text-primary mb-1.5">
                Ask Axiploy <span className="text-xs font-medium text-accent-cyan align-middle ml-2 px-2 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20">Included with every workforce</span>
              </h3>
              <p className="text-text-muted text-sm leading-relaxed max-w-2xl">
                Your AI operations director. Ask anything about your business in plain English —
                &ldquo;what&rsquo;s happening today?&rdquo;, &ldquo;who&rsquo;s missing documents?&rdquo; — and get instant
                answers drawn from your live data.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-accent-cyan text-sm font-medium shrink-0 hover:gap-2.5 transition-all"
            >
              See it in action <ArrowRight size={14} />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
