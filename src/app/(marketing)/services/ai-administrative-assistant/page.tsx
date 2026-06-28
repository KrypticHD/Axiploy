import type { Metadata } from "next";
import ServicePage, { ServiceData } from "@/components/ServicePage";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Administrative Assistant — Axiploy",
  description:
    "Automate scheduling, reporting, data entry and communications with Axiploy's AI Administrative Assistant. Free your team to focus on high-value work.",
};

const data: ServiceData = {
  title: "AI Administrative Assistant",
  tagline:
    "Handle the daily flood of admin tasks automatically — so your team can stop chasing paperwork and start doing the work that matters.",
  overview:
    "The AI Administrative Assistant takes ownership of the routine administrative tasks that consume your team's time every day. From managing schedules and generating reports to processing data and handling routine communications, this digital employee works continuously in the background — accurately, consistently and without needing direction.",
  icon: ClipboardList,
  problems: [
    "Staff spending 60%+ of their time on admin instead of core responsibilities",
    "Inconsistent reporting due to manual data compilation",
    "Delays in responding to routine client and internal communications",
    "Data entry errors causing downstream problems",
    "Managers without visibility into operational status",
    "Bottlenecks when key admin staff are absent",
  ],
  features: [
    {
      title: "Scheduling Automation",
      description:
        "Manages appointments, meetings, inspections and resource scheduling — coordinating across stakeholders without manual intervention.",
    },
    {
      title: "Automated Reporting",
      description:
        "Generates and distributes regular operational reports on time, every time — pulling from your existing data sources.",
    },
    {
      title: "Data Entry & Processing",
      description:
        "Handles structured data entry tasks accurately and at scale — eliminating the risk of human error in repetitive input tasks.",
    },
    {
      title: "Communication Handling",
      description:
        "Responds to routine enquiries, sends updates and manages internal communications based on predefined rules and triggers.",
    },
    {
      title: "Document Management",
      description:
        "Files, retrieves and organises documents systematically — ensuring the right information is always in the right place.",
    },
    {
      title: "Task Tracking",
      description:
        "Monitors outstanding tasks, sends reminders and escalates overdue items — keeping operations moving without manual oversight.",
    },
  ],
  benefits: [
    "Reclaim hundreds of admin hours per month",
    "Consistent, accurate reporting delivered on time",
    "Zero errors on repetitive data entry tasks",
    "Faster response times on routine communications",
    "Operational continuity regardless of staff availability",
    "Real-time visibility into task and process status",
  ],
  workflow: [
    {
      step: "Process Mapping",
      description:
        "We map your existing admin workflows and identify the tasks best suited for AI automation.",
    },
    {
      step: "Configuration",
      description:
        "The AI Administrative Assistant is configured to your specific processes, rules and communication requirements.",
    },
    {
      step: "Integration",
      description:
        "We connect the assistant to your existing tools — email, calendar, CRM, project management and reporting systems.",
    },
    {
      step: "Deployment",
      description:
        "The AI employee begins handling tasks — running in the background, logging activity and escalating exceptions.",
    },
    {
      step: "Optimisation",
      description:
        "We review performance regularly and refine the assistant's rules and triggers to improve efficiency over time.",
    },
  ],
  industries: [
    "Professional Services",
    "Recruitment",
    "Engineering",
    "Labour Hire",
    "Construction",
    "Property",
    "Mining",
    "Trades",
  ],
  faqs: [
    {
      q: "Which admin tasks can the AI Administrative Assistant handle?",
      a: "It handles scheduling, reporting, data entry, routine communications, document management and task tracking. During implementation we assess your specific workflows and configure the assistant accordingly.",
    },
    {
      q: "Will it replace our admin staff?",
      a: "No. The AI Administrative Assistant handles repetitive, time-consuming tasks — freeing your existing team to focus on judgement-based, relationship-driven work that genuinely requires a human.",
    },
    {
      q: "How does it connect to our existing systems?",
      a: "We build integrations to your existing tools as part of the implementation. The assistant works within your current tech stack — no replacement required.",
    },
    {
      q: "What if a task falls outside the assistant's scope?",
      a: "The AI is configured to escalate out-of-scope items to a nominated team member, ensuring nothing is handled incorrectly or ignored.",
    },
  ],
};

export default function AIAdministrativeAssistantPage() {
  return <ServicePage data={data} />;
}
