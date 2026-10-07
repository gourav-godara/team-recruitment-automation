export default function ComparisonSection() {
  return (
    <section className="w-full px-4 py-16 bg-brand-cream retro-border border-x-0" id="comparison">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-2 max-w-2xl">
          <span className="px-3 py-1 self-start rounded-full text-xs font-mono font-extrabold bg-brand-pink text-white retro-border shadow-pop-sm">
            THE HEAD-TO-HEAD BATTLE
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl text-brand-dark">
            Messy Sheets vs. Clean Machine
          </h2>
          <p className="font-sans text-base text-slate-600 font-medium">
            Spreadsheets assembled under 2 AM caffeine delirium frequently collapse when sponsors ask for proof. Here is how ShortlistIQ saves the night.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Messy Spreadsheets Card */}
          <div className="bg-white retro-border rounded-3xl p-6 md:p-8 shadow-pop-card flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200">
              <div className="flex items-center gap-2 text-rose-600 font-display font-black text-xl">
                <span className="material-symbols-outlined text-2xl font-bold">warning</span>
                <span>Broken 2AM Spreadsheets</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-mono font-bold text-xs retro-border">
                DISASTER PRONE
              </span>
            </div>

            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-100 retro-border flex items-center justify-center text-rose-600 font-bold shrink-0 mt-0.5">
                  ✕
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    Silent Formula Drift
                  </span>
                  <span className="font-sans text-xs text-slate-600 font-medium leading-relaxed">
                    Accidental formula edits in column 42 weigh an outlier judge 4x heavier without anyone noticing.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-100 retro-border flex items-center justify-center text-rose-600 font-bold shrink-0 mt-0.5">
                  ✕
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    Missing Data Defaults to Zero
                  </span>
                  <span className="font-sans text-xs text-slate-600 font-medium leading-relaxed">
                    If one judge skips evaluating a top team, an empty cell counts as 0, immediately disqualifying stellar work.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-100 retro-border flex items-center justify-center text-rose-600 font-bold shrink-0 mt-0.5">
                  ✕
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    Zero Cutoff Stress-Testing
                  </span>
                  <span className="font-sans text-xs text-slate-600 font-medium leading-relaxed">
                    Zero clue whether Rank #10 and Rank #11 differ by 0.001 points due to random grading bias or pure luck.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-100 retro-border flex items-center justify-center text-rose-600 font-bold shrink-0 mt-0.5">
                  ✕
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    Indefensible Final Lists
                  </span>
                  <span className="font-sans text-xs text-slate-600 font-medium leading-relaxed">
                    When the $10k sponsor asks why Team X wasn't chosen, you have zero immutable logs to prove fairness.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Clean Machine ShortlistIQ Card */}
          <div className="bg-brand-yellow/30 retro-border rounded-3xl p-6 md:p-8 shadow-pop-card flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-brand-dark">
              <div className="flex items-center gap-2 text-brand-blue font-display font-black text-xl">
                <span className="material-symbols-outlined text-2xl font-bold">verified</span>
                <span>ShortlistIQ Clean Machine</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-brand-yellow text-brand-dark font-mono font-bold text-xs retro-border shadow-pop-sm">
                ROCK SOLID v2.4
              </span>
            </div>

            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-green retro-border shadow-pop-sm flex items-center justify-center text-brand-dark font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    Strict Mathematical Normalization
                  </span>
                  <span className="font-sans text-xs text-slate-700 font-medium leading-relaxed">
                    Z-score standard deviation dynamic balancing harmonizes strict and lenient graders automatically.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-green retro-border shadow-pop-sm flex items-center justify-center text-brand-dark font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    Explicit Uncertainty Bands
                  </span>
                  <span className="font-sans text-xs text-slate-700 font-medium leading-relaxed">
                    Unscored projects surfaced with explicit confidence margins instead of arbitrary zeroes.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-green retro-border shadow-pop-sm flex items-center justify-center text-brand-dark font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    10,000-Run Monte Carlo Simulation
                  </span>
                  <span className="font-sans text-xs text-slate-700 font-medium leading-relaxed">
                    Instantly exposes hair-thin border swaps so organizers can run a targeted 5-minute tiebreaker.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-brand-green retro-border shadow-pop-sm flex items-center justify-center text-brand-dark font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-brand-dark text-base">
                    Cryptographically Sealed Audits
                  </span>
                  <span className="font-sans text-xs text-slate-700 font-medium leading-relaxed">
                    SHA-256 stamped audit certificates that prove uncorrupted scoring parameters to every sponsor.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
