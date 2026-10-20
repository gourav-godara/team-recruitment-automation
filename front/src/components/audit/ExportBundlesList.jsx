import { mockExportBundles } from '../../data/mockAudit';

export default function ExportBundlesList({
  onDownloadFinalistCsv,
  onDownloadManifestJson,
  onDownloadTrackReports,
  onDownloadDeliberationNotes,
  onInspectManifest,
}) {
  const handleAction = (bundleId) => {
    if (bundleId === 'bundle-finalist') {
      onDownloadFinalistCsv();
    } else if (bundleId === 'bundle-manifest') {
      onDownloadManifestJson();
    } else if (bundleId === 'bundle-tracks') {
      onDownloadTrackReports();
    } else if (bundleId === 'bundle-deliberation') {
      onDownloadDeliberationNotes();
    }
  };

  return (
    <div className="flex flex-col gap-space-md">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-primary-container border border-[#0f172a] rounded-sm"></span>
          <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight font-extrabold">
            Export Bundles &amp; Download Assets
          </h2>
        </div>
        <span className="font-label-sm text-label-sm font-mono text-on-surface-variant font-bold">
          FORMATS: CSV, JSON, PDF, TXT
        </span>
      </div>

      {/* 4 Cards Grid */}
      <div className="flex flex-col gap-space-md">
        {mockExportBundles.map((bundle) => (
          <div
            key={bundle.id}
            className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:shadow-[5px_5px_0px_#0f172a] transition-all flex flex-col sm:flex-row gap-space-md justify-between items-start sm:items-center group"
          >
            <div className="flex items-start gap-space-sm">
              {/* Neo-Memphis Icon Container */}
              <div
                className={`w-12 h-12 rounded-lg border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center shrink-0 ${bundle.iconBg}`}
              >
                <span className="material-symbols-outlined text-2xl font-bold">
                  {bundle.icon}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                    {bundle.title}
                  </h3>
                  <span
                    className={`font-label-sm text-label-sm px-1.5 py-0.5 rounded border border-[#0f172a] font-mono font-bold ${bundle.badgeBg}`}
                  >
                    {bundle.badge}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md leading-relaxed">
                  {bundle.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs font-mono text-on-surface-variant font-medium">
                  {bundle.meta.map((m, idx) => (
                    <span key={idx} className="flex items-center gap-2">
                      {idx > 0 && <span className="text-outline-variant">•</span>}
                      <span>
                        {m.label}: <strong className="text-on-surface">{m.value}</strong>
                      </span>
                    </span>
                  ))}
                  {bundle.id === 'bundle-manifest' && onInspectManifest && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectManifest();
                      }}
                      className="text-primary hover:underline font-bold ml-1 cursor-pointer flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">visibility</span>
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAction(bundle.id)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_#0f172a] font-label-lg text-label-lg whitespace-nowrap transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
            >
              <span className="material-symbols-outlined text-base font-bold">
                {bundle.buttonIcon}
              </span>
              <span>{bundle.buttonText}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
