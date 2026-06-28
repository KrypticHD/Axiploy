import AnimatedSection from "./AnimatedSection";

const industries = [
  "Mining",
  "Construction",
  "Labour Hire",
  "Engineering",
  "Recruitment",
  "Trades",
  "Property",
  "Professional Services",
  "Manufacturing",
  "Healthcare Administration",
  "Logistics",
  "Financial Services",
];

export default function Industries() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection className="text-center mb-14">
          <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
            Industries
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-text-primary mt-3 mb-5">
            Built for Real Business
          </h2>
          <p className="text-text-muted text-lg max-w-xl mx-auto">
            Axiploy delivers AI employees across industries where operational efficiency matters most.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="flex flex-wrap gap-3 justify-center">
            {industries.map((ind) => (
              <span
                key={ind}
                className="glass px-5 py-2.5 rounded-full text-sm text-text-primary border border-white/[0.08] hover:border-accent-blue/30 hover:text-accent-cyan transition-all duration-200 cursor-default"
              >
                {ind}
              </span>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
