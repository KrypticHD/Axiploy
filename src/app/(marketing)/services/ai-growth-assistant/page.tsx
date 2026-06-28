import type { Metadata } from "next";
import ServicePage, { ServiceData } from "@/components/ServicePage";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Growth Assistant — Axiploy",
  description:
    "Drive lead follow-up, client engagement and pipeline management automatically with Axiploy's AI Growth Assistant.",
};

const data: ServiceData = {
  title: "AI Growth Assistant",
  tagline:
    "Never lose a lead to slow follow-up again. Your AI Growth Assistant engages prospects, nurtures relationships and moves opportunities forward — automatically.",
  overview:
    "The AI Growth Assistant acts as a tireless sales and client engagement engine. It follows up leads instantly, nurtures prospects through the pipeline, re-engages dormant clients and ensures no opportunity falls through the cracks — all without requiring your team to manage the process manually.",
  icon: TrendingUp,
  problems: [
    "Leads going cold because follow-up happens too slowly",
    "Salespeople spending time on admin instead of selling",
    "No consistent nurture process for prospects not ready to buy",
    "Dormant clients never re-engaged",
    "Lack of visibility into pipeline health",
    "Inconsistent client communication that damages relationships",
  ],
  features: [
    {
      title: "Instant Lead Response",
      description:
        "Responds to new enquiries within seconds — capturing interest before it fades and qualifying the opportunity automatically.",
    },
    {
      title: "Pipeline Nurturing",
      description:
        "Maintains consistent, relevant communication with prospects at every stage of the pipeline — moving them forward without manual effort.",
    },
    {
      title: "Client Re-engagement",
      description:
        "Identifies dormant clients and reaches out with targeted messages to reactivate relationships and surface new opportunities.",
    },
    {
      title: "Meeting Booking",
      description:
        "Handles scheduling of discovery calls and appointments — removing friction from the conversion process.",
    },
    {
      title: "Pipeline Reporting",
      description:
        "Provides real-time visibility into lead volume, engagement rates and pipeline status — so your team always knows where things stand.",
    },
    {
      title: "CRM Integration",
      description:
        "Logs all interactions directly into your CRM — maintaining accurate records without manual data entry.",
    },
  ],
  benefits: [
    "Respond to every lead within seconds, not hours",
    "Increase conversion rates through consistent follow-up",
    "Surface dormant opportunities your team has forgotten",
    "Free salespeople to focus on closing, not chasing",
    "Full pipeline visibility without manual reporting",
    "Scale outreach without increasing headcount",
  ],
  workflow: [
    {
      step: "Lead Capture",
      description:
        "A new enquiry arrives via your website, phone or other channel — the AI Growth Assistant is immediately notified.",
    },
    {
      step: "Instant Engagement",
      description:
        "The AI responds within seconds with a personalised message, qualifying questions and next-step guidance.",
    },
    {
      step: "Nurture Sequence",
      description:
        "If the lead is not immediately ready, the AI enters them into a nurture sequence with timed, relevant follow-ups.",
    },
    {
      step: "Meeting Booking",
      description:
        "When the prospect is ready, the AI books the meeting or discovery call directly into your team's calendar.",
    },
    {
      step: "Handover",
      description:
        "Qualified, engaged prospects are handed to your team with full context — ready to close, not to cold-introduce.",
    },
  ],
  industries: [
    "Property",
    "Recruitment",
    "Trades",
    "Professional Services",
    "Labour Hire",
    "Engineering",
    "Construction",
    "Financial Services",
  ],
  faqs: [
    {
      q: "What channels does the AI Growth Assistant operate across?",
      a: "It can be configured to operate across email, SMS, website chat and other digital channels — depending on where your leads and clients engage with you.",
    },
    {
      q: "How personalised are the communications?",
      a: "Messages are highly personalised based on the prospect's enquiry, industry, behaviour and stage in the pipeline — they do not read like automated templates.",
    },
    {
      q: "Does it replace our sales team?",
      a: "No. It handles the volume, repetitive follow-up that slows sales teams down — so your people can spend their time on conversations that actually require a human.",
    },
    {
      q: "Can it work within our existing CRM?",
      a: "Yes. We integrate the AI Growth Assistant into your existing CRM so all activity is logged automatically and your team works within the tools they already use.",
    },
    {
      q: "How quickly can we see results?",
      a: "Most clients see measurable improvement in lead response speed and follow-up consistency within the first month of deployment.",
    },
  ],
};

export default function AIGrowthAssistantPage() {
  return <ServicePage data={data} />;
}
