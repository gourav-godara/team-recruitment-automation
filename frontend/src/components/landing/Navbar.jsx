import { Link } from 'react-router-dom';

export default function Navbar({ onDropCsvClick }) {
  return (
    <header className="fixed top-3 left-0 right-0 z-50 px-4 max-w-7xl mx-auto">
      <div className="bg-white retro-border shadow-pop-lg rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Badges */}
        <div className="flex items-center gap-3 shrink-0">
          <Link className="flex items-center gap-2 group" to="/">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow retro-border shadow-pop-sm flex items-center justify-center font-display font-extrabold text-xl group-hover:rotate-6 transition-transform">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-tight leading-none text-brand-dark">
                ShortlistIQ
              </span>
              <span className="text-[10px] font-mono font-bold text-brand-blue uppercase tracking-wider">
                TEAM RECRUITMENT AUTOMATION
              </span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-green/30 text-emerald-800 retro-border shadow-pop-sm">
              ● DECISION ENGINE READY
            </span>
          </div>
        </div>

        {/* Center Links / Workflow Steps */}
        <nav className="hidden lg:flex items-center gap-1 font-display font-semibold text-sm">
          <Link
            to="/schema-mapper"
            className="px-3 py-1.5 rounded-xl hover:bg-brand-yellow/50 retro-border border-transparent hover:border-brand-dark hover:shadow-pop-sm transition-all"
          >
            1. Schema
          </Link>
          <Link
            to="/data-quality"
            className="px-3 py-1.5 rounded-xl hover:bg-brand-yellow/50 retro-border border-transparent hover:border-brand-dark hover:shadow-pop-sm transition-all"
          >
            2. Data Quality
          </Link>
          <Link
            to="/scoring-engine"
            className="px-3 py-1.5 rounded-xl hover:bg-brand-yellow/50 retro-border border-transparent hover:border-brand-dark hover:shadow-pop-sm transition-all"
          >
            3. Scoring Rules
          </Link>
          <Link
            to="/ranked-results"
            className="px-3 py-1.5 rounded-xl bg-brand-yellow text-brand-dark retro-border shadow-pop-sm transition-transform hover:-translate-y-0.5 font-bold"
          >
            4. Shortlist Leaderboard
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDropCsvClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white font-display font-bold text-xs md:text-sm retro-border shadow-pop hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-pop-hover active:shadow-none transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">upload_file</span>
            <span>Upload CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
}
