export default function SinglePageExport({
  runInfo,
  onExportCsv,
  onExportShortlistOnly,
}) {
  return (
    <section id="export-section" className="scroll-mt-20 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b-4 border-[#0F172A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-mono font-bold text-xs border-2 border-[#0F172A] flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
              06
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-900">
              AUDIT TRAILS & DATA EXPORT
            </span>
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-[#0F172A] mt-1">
            Export Candidate Results & Documentation
          </h2>
          <p className="text-sm font-sans text-slate-600 font-medium">
            Download standard RFC 4180 CSV ledgers for spreadsheet processing and ATS integration.
          </p>
        </div>
      </div>

      {/* Main Export Card */}
      <div className="bg-white rounded-3xl border-4 border-[#0F172A] p-6 md:p-10 shadow-[6px_6px_0px_#0F172A] grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Download Action Buttons */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-display font-black text-xl text-[#0F172A]">
              Download Formatted Spreadsheets
            </h3>
            <p className="text-xs font-sans text-slate-600 font-medium">
              Files are pre-formatted for Microsoft Excel, Apple Numbers, and Google Sheets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onExportCsv}
              className="px-6 py-3.5 bg-brand-yellow hover:bg-yellow-300 text-[#0F172A] font-display font-black text-sm rounded-xl border-3 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0F172A] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl font-bold">table_view</span>
              <span>Official Full Results CSV</span>
            </button>

            <button
              type="button"
              onClick={onExportShortlistOnly || onExportCsv}
              className="px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-[#0F172A] font-display font-black text-sm rounded-xl border-3 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0F172A] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl font-bold">military_tech</span>
              <span>Shortlisted Only CSV</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono font-bold text-slate-500">
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-[#0F172A]">RFC 4180 COMPLIANT</span>
            <span>•</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-[#0F172A]">UTF-8 ENCODED</span>
            <span>•</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-[#0F172A]">NO TRUNCATION</span>
          </div>
        </div>

        {/* Right: Reproducibility & Audit Box */}
        <div className="bg-slate-50 rounded-2xl border-3 border-[#0F172A] p-5 shadow-[3px_3px_0px_#0F172A] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-mono font-bold text-xs text-slate-700 uppercase flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Deterministic Reproducibility
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold border border-emerald-400">
              AUDITED
            </span>
          </div>

          <div className="flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Run ID:</span>
              <span className="font-bold text-[#0F172A]">
                {runInfo?.run_id ? `#${runInfo.run_id}` : 'Local-Session'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Engine Version:</span>
              <span className="font-bold text-brand-blue">v2.0.0 (Pure Deterministic)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Audit Rule Gates:</span>
              <span className="font-bold text-slate-700">Enforced & Logged</span>
            </div>
          </div>

          <p className="text-[11px] font-sans text-slate-600 border-t border-slate-200 pt-2 mt-1">
            Every candidate ranking produced by the engine is 100% reproducible with matching input data and weight vectors.
          </p>
        </div>
      </div>
    </section>
  );
}
