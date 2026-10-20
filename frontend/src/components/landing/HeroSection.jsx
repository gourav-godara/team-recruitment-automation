import DropZoneHopper from './DropZoneHopper';
import TelemetryCards from './TelemetryCards';

export default function HeroSection({ onUploadSuccess, onError, isIngesting }) {
  return (
    <section className="relative w-full px-4 pt-12 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Title & Playful Sticker Badges */}
        <div className="flex flex-col gap-4 text-center items-center max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-brand-dark retro-border shadow-pop-sm -rotate-2">
              🚀 PUBLIC NO-LOGIN ARENA
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-green text-brand-dark retro-border shadow-pop-sm rotate-2">
              🛡️ Deterministic Decision Engine
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-pink text-white retro-border shadow-pop-sm -rotate-1">
              🔒 Session-Isolated Privacy
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-yellow text-brand-dark retro-border shadow-pop-sm rotate-1">
              ✨ 100% Explainable Scores
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-brand-dark tracking-tight leading-[1.08] max-w-3xl">
            Ditch the Broken 2AM Spreadsheets.{' '}
            <span className="bg-brand-yellow px-2 py-0.5 retro-border shadow-pop-sm inline-block rotate-1">
              Shortlist Teams
            </span>{' '}
            Like a Pro.
          </h1>

          <p className="font-sans text-base sm:text-lg text-slate-700 max-w-2xl font-medium leading-relaxed">
            Evaluate candidate teams with configurable scoring criteria, transparent decision explanations, deterministic tie-breaking, and instant RFC 4180 CSV audit packages.
          </p>
        </div>

        {/* Central Drop Zone */}
        <DropZoneHopper
          onUploadSuccess={onUploadSuccess}
          onError={onError}
          isIngesting={isIngesting}
        />

        {/* Fun Telemetry Pop-Card Counters */}
        <TelemetryCards />
      </div>
    </section>
  );
}
