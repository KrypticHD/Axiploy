import Hero from "@/components/Hero";
import CapabilityStrip from "@/components/CapabilityStrip";
import AgentCards from "@/components/AgentCards";
import WhyAxiploy from "@/components/WhyAxiploy";
import HowItWorks from "@/components/HowItWorks";
import Outcomes from "@/components/Outcomes";
import CtaBanner from "@/components/CtaBanner";

export default function Home() {
  return (
    <>
      <Hero />
      <CapabilityStrip />
      <AgentCards />
      <WhyAxiploy />
      <HowItWorks />
      <Outcomes />
      <CtaBanner />
    </>
  );
}
