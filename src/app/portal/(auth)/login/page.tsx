"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, AlertCircle, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleForgot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotLoading(true);
    await fetch("/api/portal/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });
    setForgotSent(true);
    setForgotLoading(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const res = await fetch("/api/portal/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push("/portal/inbox");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Invalid email/username or password");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/40 text-sm focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all duration-200";

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-accent-blue/8 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="Axiploy" width={320} height={88} className="h-24 w-auto object-contain" />
          </Link>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 border border-white/[0.08] glow-blue">
          {forgotMode ? (
            <>
              <div className="text-center mb-7">
                <h1 className="font-heading text-2xl font-bold text-text-primary">Reset Password</h1>
                <p className="text-text-muted text-sm mt-2 leading-relaxed">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>
              {forgotSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={22} className="text-emerald-400" />
                  </div>
                  <p className="text-text-primary text-sm font-medium">Check your email</p>
                  <p className="text-text-muted text-xs mt-1">If that address is registered, a reset link is on its way.</p>
                  <button onClick={() => { setForgotMode(false); setForgotSent(false); }} className="mt-5 text-accent-cyan text-xs hover:underline">
                    Back to login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="text-text-muted text-xs mb-1.5 block">Email address</label>
                    <input type="email" required placeholder="you@company.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className={inputClass} />
                  </div>
                  <button type="submit" disabled={forgotLoading} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 text-white font-semibold text-sm transition-all mt-2">
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                    {!forgotLoading && <ArrowRight size={15} />}
                  </button>
                  <button type="button" onClick={() => setForgotMode(false)} className="w-full text-text-muted text-xs hover:underline text-center">
                    Back to login
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="text-center mb-7">
                <h1 className="font-heading text-2xl font-bold text-text-primary">Access Your AI Workforce</h1>
                <p className="text-text-muted text-sm mt-2 leading-relaxed">
                  Log in to view your Digital Employees, reports, approvals and business activity.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">Email or Username</label>
                  <input name="email" type="text" required placeholder="you@company.com or username" className={inputClass} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-text-muted text-xs">Password</label>
                    <button type="button" onClick={() => setForgotMode(true)} className="text-accent-cyan text-xs hover:underline">Forgot password?</button>
                  </div>
                  <input name="password" type="password" required placeholder="••••••••" className={inputClass} />
                </div>

                <div className="flex items-center gap-2">
                  <input id="remember" name="remember" type="checkbox" className="w-3.5 h-3.5 rounded border-white/20 accent-accent-blue" />
                  <label htmlFor="remember" className="text-text-muted text-xs cursor-pointer">Remember me</label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-accent-blue/25 mt-2"
                >
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight size={15} />}
                </button>
              </form>
            </>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-6 text-text-muted/60 text-xs">
            <Lock size={11} />
            Secured with 256-bit encryption
          </div>
        </div>


      </div>
    </div>
  );
}
