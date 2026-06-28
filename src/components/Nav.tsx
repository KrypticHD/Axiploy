"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/#services", label: "Digital Employees" },
  { href: "/technology", label: "Technology" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-white/[0.06] shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-32 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Axiploy"
            width={400}
            height={120}
            className="h-28 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/portal/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/[0.10] hover:border-white/20 text-text-muted hover:text-text-primary text-sm font-medium transition-all duration-200"
          >
            Client Login
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors duration-200"
          >
            Book a Call
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-text-muted hover:text-text-primary"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass border-t border-white/[0.06] px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/portal/login"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full glass border border-white/[0.10] text-text-muted text-sm font-medium transition-colors"
          >
            Client Login
          </Link>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-accent-blue hover:bg-accent-blue-light text-white text-sm font-medium transition-colors"
          >
            Book a Call
          </Link>
        </div>
      )}
    </header>
  );
}
