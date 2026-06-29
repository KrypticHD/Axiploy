"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Supabase puts the tokens in the URL hash after redirect
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
  }, [supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/portal/login"), 2500);
    }
  }

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/40 text-sm focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all duration-200";

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-accent-blue/8 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/"><Image src="/logo.png" alt="Axiploy" width={160} height={44} className="h-11 w-auto object-contain" /></Link>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/[0.08]">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
              <h1 className="font-heading text-xl font-bold text-text-primary">Password updated</h1>
              <p className="text-text-muted text-sm mt-2">Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <h1 className="font-heading text-2xl font-bold text-text-primary">Set New Password</h1>
                <p className="text-text-muted text-sm mt-2">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5">
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {!ready && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5">
                  <p className="text-amber-300 text-sm">Verifying reset link...</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">New Password</label>
                  <input type="password" required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-text-muted text-xs mb-1.5 block">Confirm Password</label>
                  <input type="password" required placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
                </div>
                <button
                  type="submit"
                  disabled={loading || !ready}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-accent-blue hover:bg-accent-blue-light disabled:opacity-60 text-white font-semibold text-sm transition-all mt-2"
                >
                  {loading ? "Updating..." : "Update Password"}
                  {!loading && <ArrowRight size={15} />}
                </button>
              </form>
            </>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-6 text-text-muted/60 text-xs">
            <Lock size={11} /> Secured with 256-bit encryption
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
