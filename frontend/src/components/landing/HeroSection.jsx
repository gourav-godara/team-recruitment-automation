import DropZoneHopper from './DropZoneHopper';
import TelemetryCards from './TelemetryCards';

export default function HeroSection({ onLoadDemo, onFileUpload, isIngesting }) {
  return (
    <section className="relative w-full px-4 pt-12 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Title & Playful Sticker Badges */}
        <div className="flex flex-col gap-4 text-center items-center max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-brand-dark retro-border shadow-pop-sm -rotate-2">
              🚀 INGESTION ARENA
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-green text-brand-dark retro-border shadow-pop-sm rotate-2">
              🛡️ 100% Client-Side Engine
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-pink text-white retro-border shadow-pop-sm -rotate-1">
              🔒 Zero Cloud Leakage
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-yellow text-brand-dark retro-border shadow-pop-sm rotate-1">
              ✨ Instant Consensus Math
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-brand-dark tracking-tight leading-[1.08] max-w-3xl">
            Ditch the Broken 2AM Spreadsheets.{' '}
            <span className="bg-brand-yellow px-2 py-0.5 retro-border shadow-pop-sm inline-block rotate-1">
              Shortlist Hackathons
            </span>{' '}
            Like a Pro.
          </h1>

          <p className="font-sans text-base sm:text-lg text-slate-700 max-w-2xl font-medium leading-relaxed">
            Parse multi-judge rubrics, normalize biased outliers with z-score magic, stress-test cutoffs with Monte Carlo runs, and seal audit certificates in seconds.
          </p>
        </div>

        {/* Central Drop Zone */}
        <DropZoneHopper
          onLoadDemo={onLoadDemo}
          onFileUpload={onFileUpload}
          isIngesting={isIngesting}
        />

        {/* Fun Telemetry Pop-Card Counters */}
        <TelemetryCards />
      </div>
    </section>
  );
}
