import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import AnimatedSection from "@/components/AnimatedSection";
import { Mail, Clock, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Axiploy",
  description:
    "Book a free discovery call with Axiploy or send us a message. Let's explore how AI employees can help your business.",
};

export default function ContactPage() {
  return (
    <div className="pt-24">
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent-blue/8 blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection className="text-center mb-16">
            <span className="text-accent-cyan text-sm font-semibold tracking-widest uppercase">
              Get In Touch
            </span>
            <h1 className="font-heading text-5xl sm:text-6xl font-bold text-text-primary mt-3 mb-5">
              Let&apos;s Build Your{" "}
              <span className="gradient-text">AI Workforce</span>
            </h1>
            <p className="text-text-muted text-xl max-w-2xl mx-auto">
              Book a free discovery call or send us a message. We&apos;ll respond within one business day.
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <AnimatedSection delay={0.1}>
              <ContactForm />
            </AnimatedSection>

            {/* Info side */}
            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                {/* Calendly / booking */}
                <div className="glass rounded-2xl p-8 border border-accent-blue/15">
                  <h3 className="font-heading text-xl font-semibold text-text-primary mb-3">
                    Book a Discovery Call
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed mb-6">
                    Prefer to speak directly? Book a free 30-minute discovery call and let&apos;s
                    explore how Axiploy can help your business.
                  </p>
                  <a
                    href="https://calendly.com/axiploy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full gap-2 px-6 py-3.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25"
                  >
                    Book a Free Discovery Call
                  </a>
                </div>

                {/* Details */}
                <div className="glass rounded-2xl p-8 space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Email</p>
                      <a
                        href="mailto:hello@axiploy.com.au"
                        className="text-text-primary text-sm hover:text-accent-cyan transition-colors"
                      >
                        hello@axiploy.com.au
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                      <Clock size={16} className="text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Response Time</p>
                      <p className="text-text-primary text-sm">Within 1 business day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-text-muted text-xs mb-1">Location</p>
                      <p className="text-text-primary text-sm">Australia — Serving clients nationwide</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
