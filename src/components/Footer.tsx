import Link from "next/link";
import Image from "next/image";

const services = [
  { href: "/services/ai-onboarding-assistant", label: "AI Onboarding Assistant" },
  { href: "/services/ai-administrative-assistant", label: "AI Administrative Assistant" },
  { href: "/services/ai-growth-assistant", label: "AI Growth Assistant" },
];

const company = [
  { href: "/about", label: "About" },
  { href: "/technology", label: "Technology" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-surface/50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Image
              src="/logo.png"
              alt="Axiploy"
              width={130}
              height={34}
              className="h-8 w-auto object-contain mb-4"
            />
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              Your outsourced AI department. Helping businesses scale through intelligent digital employees.
            </p>
          </div>

          {/* Digital Employees */}
          <div>
            <h4 className="text-text-primary text-sm font-semibold mb-4">Digital Employees</h4>
            <ul className="space-y-2.5">
              {services.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-text-muted text-sm hover:text-text-primary transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-text-primary text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5">
              {company.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="text-text-muted text-sm hover:text-text-primary transition-colors">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} Axiploy. All rights reserved.
          </p>
          <p className="text-text-muted text-sm">
            AI Employees That Get Work Done.
          </p>
        </div>
      </div>
    </footer>
  );
}
