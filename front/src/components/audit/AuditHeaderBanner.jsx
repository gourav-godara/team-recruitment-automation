import { useState } from 'react';

export default function AuditHeaderBanner({
  onCopyLink,
  onDownloadPackage,
  blockNumber = 19842910,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section className="bg-surface-container-lowest rounded-xl p-space-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] relative overflow-hidden mb-space-lg">
      {/* Neo-Memphis Graphic Deco Shapes */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary-fixed/30 rounded-full border-2 border-[#0f172a] pointer-events-none -z-0"></div>
      <div className="absolute right-24 -bottom-6 w-16 h-16 bg-primary-fixed border-2 border-[#0f172a] rotate-12 pointer-events-none -z-0"></div>
      <div className="absolute right-64 top-4 text-[#0f172a]/15 text-6xl font-black select-none pointer-events-none font-display">
        SHA-256
      </div>

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
        <div className="max-w-3xl">
          {/* Breadcrumbs & Tactical Badges */}
          <div className="flex flex-wrap items-center gap-space-xs mb-space-sm">
            <span className="font-label-sm text-label-sm uppercase px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] tracking-wider font-extrabold">
              STAGE 07 // AUDIT LEDGER &amp; SIGNING
            </span>
            <span className="font-label-sm text-label-sm uppercase px-2.5 py-1 rounded-full bg-[#10b981] text-on-primary border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-extrabold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm font-bold">verified_user</span>
              IMMUTABLE AUDIT TRAIL
            </span>
            <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface border border-[#0f172a] font-mono font-bold">
              BLOCK #{blockNumber}
            </span>
          </div>

          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mb-space-xs font-black">
            Export &amp; Cryptographic Audit
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
            Seal finalized consensus rankings, generate SHA-256 tamper-evident verification receipts, and export complete audit bundles for sponsors, judges, and public announcement.
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-space-sm shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-lg bg-surface-container-low text-on-surface border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-surface-container hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#0f172a] font-label-lg text-label-lg uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-base">
              {copied ? 'check' : 'link'}
            </span>
            <span>{copied ? 'Copied Receipt URL!' : 'Copy Verification Link'}</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPackage}
            className="px-5 py-2.5 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:bg-[#ffe040] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#0f172a] font-label-lg text-label-lg uppercase tracking-wider flex items-center gap-2 transition-all font-black cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl font-bold">folder_zip</span>
            <span>Download Audit Package (.zip)</span>
          </button>
        </div>
      </div>
    </section>
  );
}
