export default function AuditKpiCards({
  ledgerStatus = 'SEALED',
  ledgerBadge = 'SHA-256 Valid',
  shortlistCount = 40,
  shortlistQuotaPct = '8.3%',
  totalSubmissions = 482,
  quorumLeads = '8 / 8 Leads',
  quorumSignedPct = '100% Signed',
  stabilityConfidence = '92.5% Robust',
  stabilityRuns = '10k Runs',
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
      {/* KPI 1: Audit Ledger Status */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-on-surface-variant">
            AUDIT LEDGER STATUS
          </span>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#10b981] text-on-primary border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
            {ledgerBadge}
          </span>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="font-headline-lg text-headline-lg text-on-surface font-black tracking-tight">
            {ledgerStatus}
          </span>
          <span className="material-symbols-outlined text-[#10b981] text-2xl font-bold">
            verified
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 font-mono text-xs">
          <span className="inline-block w-2 h-2 rounded-full bg-[#10b981]"></span>
          <span>State Merkle root committed</span>
        </p>
      </div>

      {/* KPI 2: Final Shortlist Size */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-on-surface-variant">
            FINAL SHORTLIST SIZE
          </span>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
            Quorum Bound
          </span>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="font-headline-lg text-headline-lg text-on-surface font-black tracking-tight">
            {shortlistCount} Teams
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Top <strong className="text-on-surface font-bold">{shortlistQuotaPct}</strong> selected from {totalSubmissions} submissions
        </p>
      </div>

      {/* KPI 3: Jury Consensus Quorum */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-on-surface-variant">
            JURY CONSENSUS QUORUM
          </span>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
            {quorumLeads}
          </span>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="font-headline-lg text-headline-lg text-on-surface font-black tracking-tight">
            {quorumSignedPct}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          8 of 8 tier-1 lead judges authenticated
        </p>
      </div>

      {/* KPI 4: Stability Confidence */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] flex flex-col justify-between relative group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-label-sm text-label-sm uppercase font-extrabold tracking-wider text-on-surface-variant">
            STABILITY CONFIDENCE
          </span>
          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-[#8b5cf6] text-on-primary border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
            {stabilityRuns}
          </span>
        </div>
        <div className="flex items-baseline gap-2 my-1">
          <span className="font-headline-lg text-headline-lg text-on-surface font-black tracking-tight">
            {stabilityConfidence}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Invariant to &plusmn;15% Monte Carlo sweeps
        </p>
      </div>
    </section>
  );
}
