export default function Footer() {
  return (
    <footer className="w-full bg-white retro-border border-x-0 py-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-yellow retro-border shadow-pop-sm flex items-center justify-center font-display font-extrabold text-base">
                ⚡
              </div>
              <span className="font-display font-extrabold text-lg text-brand-dark">
                ShortlistIQ Engine
              </span>
            </div>
            <p className="font-sans text-xs text-slate-600 leading-relaxed font-medium">
              Deterministic criteria ranking, code integrity audits, and judge alignment pipelines for high-stakes technical hackathons.
            </p>
            <div className="font-mono text-xs text-brand-blue font-bold">
              SHA-256 BINARY: 9cf7e2..a4 (VERIFIED)
            </div>
          </div>

          {/* Column 2: Pipeline Specs */}
          <div className="flex flex-col gap-2">
            <span className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider mb-1">
              Pipeline Specs
            </span>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#pipeline-stages"
            >
              Multi-Criteria Scoring Engine
            </a>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#pipeline-stages"
            >
              LLM &amp; Plagiarism Detection
            </a>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#pipeline-stages"
            >
              Deterministic Consensus Math
            </a>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#pipeline-stages"
            >
              Telemetry &amp; Audit Logs
            </a>
          </div>

          {/* Column 3: Schemas & Formats */}
          <div className="flex flex-col gap-2">
            <span className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider mb-1">
              Schemas &amp; Formats
            </span>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#"
            >
              Team Metadata CSV Spec v2.1
            </a>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#"
            >
              Rubric Matrix JSON Schema
            </a>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#"
            >
              Judge Normalization Guidelines
            </a>
            <a
              className="font-sans text-xs text-slate-600 hover:text-brand-blue font-semibold transition-colors"
              href="#"
            >
              REST Ingestion API Reference
            </a>
          </div>

          {/* Column 4: Trust Proof */}
          <div className="flex flex-col gap-2">
            <span className="font-display font-extrabold text-sm text-brand-dark uppercase tracking-wider mb-1">
              Trust Proof
            </span>
            <div className="p-3 rounded-xl bg-brand-cream retro-border shadow-pop-sm flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-slate-500">Integrity Stamp</span>
                <span className="text-emerald-700">● LIVE VALID</span>
              </div>
              <span className="font-mono text-[10px] text-slate-600 truncate">
                0x4f8812c37e9b04d1a039771e
              </span>
              <span className="text-[11px] text-slate-600 font-medium">
                All final rosters cryptographically sealed.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold text-slate-500">
          <div>© 2026 ShortlistIQ Systems. Built for calm hackathon organizers.</div>
          <div className="flex items-center gap-4">
            <span className="bg-brand-yellow px-2 py-0.5 rounded text-brand-dark retro-border">
              SPEC-v2.4.9
            </span>
            <span>LATENCY: 14MS</span>
            <span>ZERO-VARIANCE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
