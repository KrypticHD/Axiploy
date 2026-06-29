import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import OnboardClient from "./OnboardClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function OnboardPage({ params }: PageProps) {
  const { token } = await params;

  const { data: onboarding, error } = await supabaseAdmin()
    .from("onboarding")
    .select("*, clients(name, logo_url)")
    .eq("token", token)
    .single();

  if (error || !onboarding) {
    notFound();
  }

  const { data: documents } = await supabaseAdmin()
    .from("documents")
    .select("*")
    .eq("onboarding_id", onboarding.id)
    .order("created_at", { ascending: true });

  const docs = (documents || []).map((d) => ({
    id: d.id,
    name: d.name,
    required: d.required,
    received: d.received,
    receivedAt: d.received_at,
    fileUrl: d.file_url,
  }));

  const required = docs.filter((d) => d.required);
  const received = required.filter((d) => d.received);

  const clientName = (onboarding.clients as { name?: string; logo_url?: string } | null)?.name || "Your Company";
  const logoUrl = (onboarding.clients as { name?: string; logo_url?: string } | null)?.logo_url || null;

  const startDateFormatted = onboarding.start_date
    ? new Date(onboarding.start_date).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={clientName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {clientName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-gray-900">{clientName}</span>
          </div>
          <span className="text-xs text-gray-400">Powered by Axiploy</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome, {onboarding.employee_name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-500 text-sm">
            {onboarding.role}
            {onboarding.department ? ` · ${onboarding.department}` : ""}
          </p>
          {startDateFormatted && (
            <p className="text-sm text-blue-600 font-medium mt-2">Start date: {startDateFormatted}</p>
          )}
          {onboarding.manager && (
            <p className="text-sm text-gray-500 mt-1">Manager: {onboarding.manager}</p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h2 className="font-semibold text-blue-900 mb-1">Before you start</h2>
          <p className="text-blue-700 text-sm leading-relaxed">
            Please upload the documents listed below so {clientName} can complete your onboarding.
            You can upload PDFs or take photos using your phone camera. All uploads are secure and encrypted.
          </p>
        </div>

        {/* Progress + document list */}
        <OnboardClient
          token={token}
          employeeName={onboarding.employee_name}
          documents={docs}
          receivedCount={received.length}
          requiredCount={required.length}
          initialStatus={onboarding.status}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        Secure document portal powered by{" "}
        <a href="https://axiploy.com" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
          Axiploy
        </a>
      </footer>
    </div>
  );
}
