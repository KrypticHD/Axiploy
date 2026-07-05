import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import ReportClient from "./ReportClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { token } = await params;

  const { data: client, error } = await supabaseAdmin()
    .from("clients")
    .select("id, name, logo_url")
    .eq("report_token", token)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {client.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logo_url} alt={client.name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {client.name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-gray-900">{client.name}</span>
          </div>
          <span className="text-xs text-gray-400">Powered by Axiploy</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Intro card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Report a safety incident</h1>
          <p className="text-gray-500 text-sm leading-relaxed mt-2">
            Use this form to report an injury, near-miss, property damage, or anything unsafe you noticed
            on site. You can report anonymously — your name is not required. Urgent reports are sent
            straight to the site safety contact.
          </p>
        </div>

        <ReportClient token={token} />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        Secure incident reporting powered by{" "}
        <a href="https://axiploy.com" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
          Axiploy
        </a>
      </footer>
    </div>
  );
}
