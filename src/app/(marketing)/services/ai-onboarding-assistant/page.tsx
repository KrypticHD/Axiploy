import type { Metadata } from "next";
import ServicePage, { ServiceData } from "@/components/ServicePage";
import { UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Onboarding Assistant — Axiploy",
  description:
    "Automate employee and contractor onboarding with Axiploy's AI Onboarding Assistant. Reduce manual admin, ensure compliance and onboard faster.",
};

const data: ServiceData = {
  title: "AI Onboarding Assistant",
  tagline:
    "Automate your entire onboarding process — from document collection to induction completion — without a single manual follow-up.",
  overview:
    "The AI Onboarding Assistant handles every step of the onboarding journey for new employees and contractors. It collects documents, sends induction materials, chases outstanding requirements and keeps managers informed — all automatically, all consistently, all without your team lifting a finger.",
  icon: UserCheck,
  problems: [
    "Hours spent manually chasing documents and forms",
    "Inconsistent onboarding experiences that damage first impressions",
    "Compliance gaps when onboarding steps are missed",
    "HR teams overwhelmed during high-volume hiring periods",
    "Delayed start dates due to slow paperwork processing",
    "Poor visibility into where each person is in the process",
  ],
  features: [
    {
      title: "Automated Document Collection",
      description:
        "Automatically requests, receives and stores all required onboarding documents — licenses, certifications, contracts, tax forms and more.",
    },
    {
      title: "Intelligent Follow-up",
      description:
        "Sends timely reminders to new starters until every requirement is completed — so nothing falls through the cracks.",
    },
    {
      title: "Digital Inductions",
      description:
        "Delivers induction content, safety modules and policy acknowledgements automatically and tracks completion in real time.",
    },
    {
      title: "Compliance Tracking",
      description:
        "Ensures every mandatory step is completed before a person starts — protecting the business from compliance risk.",
    },
    {
      title: "Manager Notifications",
      description:
        "Keeps hiring managers updated on onboarding progress without requiring them to chase or follow up themselves.",
    },
    {
      title: "System Integration",
      description:
        "Connects to your existing HR platform, HRIS or file management system — no duplicate data entry required.",
    },
  ],
  benefits: [
    "Onboard 3× faster with zero manual follow-up",
    "Eliminate compliance gaps and missed requirements",
    "Consistent experience for every new starter",
    "Reduce HR admin burden during peak hiring",
    "Real-time visibility into onboarding status",
    "Scale onboarding without scaling your HR team",
  ],
  workflow: [
    {
      step: "Trigger",
      description:
        "A new hire or contractor is added to the system, automatically triggering the onboarding sequence.",
    },
    {
      step: "Document Request",
      description:
        "The AI sends a personalised communication requesting all required documents and forms.",
    },
    {
      step: "Induction Delivery",
      description:
        "Induction materials, safety modules and policy documents are delivered and completion is tracked.",
    },
    {
      step: "Follow-up",
      description:
        "Outstanding items are automatically chased at scheduled intervals until the process is complete.",
    },
    {
      step: "Completion",
      description:
        "Once all requirements are met, the manager is notified and the person is confirmed ready to start.",
    },
  ],
  industries: [
    "Labour Hire",
    "Construction",
    "Mining",
    "Engineering",
    "Recruitment",
    "Trades",
    "Property",
    "Professional Services",
  ],
  faqs: [
    {
      q: "How long does it take to set up the AI Onboarding Assistant?",
      a: "Most implementations are live within two to four weeks, depending on the complexity of your onboarding requirements and the integrations needed.",
    },
    {
      q: "Can it handle different onboarding requirements for different roles?",
      a: "Yes. The AI Onboarding Assistant can be configured with different document sets, induction modules and requirements for each role type or department.",
    },
    {
      q: "Does it integrate with our existing HR system?",
      a: "We design integrations to connect with your existing platforms where possible. During the discovery process we assess what integrations are required and build them as part of the implementation.",
    },
    {
      q: "What happens if a new starter doesn't complete their onboarding?",
      a: "The AI follows up automatically at configurable intervals and escalates to a manager after a defined period — ensuring no one slips through without completing their requirements.",
    },
    {
      q: "Is the data secure?",
      a: "Yes. All data is handled within a secure, encrypted environment with role-based access controls. We comply with applicable data protection regulations.",
    },
  ],
};

export default function AIOnboardingAssistantPage() {
  return <ServicePage data={data} />;
}
