export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base">
      <div className="border-b border-white/[0.06] bg-surface px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-text-primary font-semibold text-sm">Axiploy Admin</p>
          <p className="text-text-muted text-xs">Internal use only</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          Admin Area
        </span>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
