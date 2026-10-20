export default function QualityHeaderBanner({ dataset }) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] relative overflow-hidden">
      {/* Decorative Neo-Memphis Accent Circle */}
      <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-secondary-fixed opacity-40 pointer-events-none"></div>

      {/* Left Ribbon Badges */}
      <div className="flex flex-wrap items-center gap-space-sm relative z-10">
        <span className="font-label-sm text-label-sm uppercase px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-extrabold tracking-wider">
          STAGE 02 // INTEGRITY
        </span>
        <span className="font-label-sm text-label-sm uppercase px-3 py-1 bg-tertiary-container text-on-tertiary rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center gap-1 font-extrabold tracking-wider">
          <span className="material-symbols-outlined text-sm font-bold">radar</span>
          THE 404 HUNTER
        </span>
        <span className="font-label-sm text-label-sm uppercase px-3 py-1 bg-primary-container text-on-primary-container rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center gap-1 font-extrabold tracking-wider">
          <span className="material-symbols-outlined text-sm font-bold">verified_user</span>
          RAW PARITY VERIFIED
        </span>
      </div>

      {/* Right Audited Partition Badge */}
      <div className="flex items-center gap-space-sm relative z-10">
        <div className="text-right">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block font-bold">
            Audited Partition
          </span>
          <span className="font-label-md text-label-md text-on-surface font-mono font-bold">
            {dataset.audited_partition}
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-surface-container-high border-2 border-[#0f172a] flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
          <span className="material-symbols-outlined text-on-surface text-xl">dataset</span>
        </div>
      </div>
    </div>
  );
}
