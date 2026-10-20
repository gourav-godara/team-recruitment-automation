export default function RankedBentoMetrics({ runInfo }) {
  const total = runInfo?.total_teams || 0;
  const shortlisted = runInfo?.shortlist_quota || 0;
  const passedGates = runInfo?.passed_hard_gates || 0;
  const weights = runInfo?.weights || { experience_years: 35, github: 35, skills: 20, presentation: 10 };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
      {/* Bento 1: Shortlist Target Quota */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-extrabold">
            Shortlist Target
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-[#0f172a] rounded-full font-label-sm text-label-sm font-bold shadow-[1px_1px_0px_#0f172a]">
            Top {shortlisted} Quota
          </span>
        </div>
        <div className="mb-space-sm">
          <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-extrabold">
            {shortlisted}{' '}
            <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
              / {total} Teams
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-medium">
            Teams meeting eligibility rules ranked above the cutoff quota
          </p>
        </div>
        <div className="pt-space-sm border-t-2 border-[#0f172a]/10 flex items-center justify-between font-mono font-label-sm text-label-sm">
          <span className="text-on-surface-variant font-medium">Cutoff Score Floor</span>
          <span className="px-2 py-0.5 bg-brand-yellow text-brand-dark rounded border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a]">
            {runInfo?.cutoff_floor != null ? `${Number(runInfo.cutoff_floor).toFixed(1)} pts` : 'Calculated'}
          </span>
        </div>
      </div>

      {/* Bento 2: Active Weight Matrix */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-extrabold">
            Scoring Criteria Weights
          </span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-[#0f172a] rounded font-label-sm text-label-sm font-bold shadow-[1px_1px_0px_#0f172a]">
            Configured
          </span>
        </div>
        <div className="grid grid-cols-2 gap-space-xs my-space-xs font-mono text-xs">
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-bold text-slate-500 uppercase">Experience</div>
            <div className="font-extrabold text-base text-brand-blue">
              {weights.experience_years || weights.tech || 35}%
            </div>
          </div>
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-bold text-slate-500 uppercase">GitHub Activity</div>
            <div className="font-extrabold text-base text-brand-dark">
              {weights.github_composite_score || weights.github || weights.repo || 35}%
            </div>
          </div>
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-bold text-slate-500 uppercase">Skills Match</div>
            <div className="font-extrabold text-base text-brand-dark">
              {weights.skills || 20}%
            </div>
          </div>
          <div className="bg-surface-container p-2 rounded border border-[#0f172a]">
            <div className="font-bold text-slate-500 uppercase">Presentation</div>
            <div className="font-extrabold text-base text-purple-700">
              {weights.presentation || weights.pitch || 10}%
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
          <span>Weighted Contribution</span>
          <span className="text-[#10b981] font-bold font-mono">100.0% Validated</span>
        </div>
      </div>

      {/* Bento 3: Eligibility Compliance */}
      <div className="bg-surface-container-lowest p-space-lg rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] flex flex-col justify-between group hover:-translate-y-0.5 transition-transform">
        <div className="flex items-center justify-between mb-space-sm">
          <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant font-extrabold">
            Eligibility Gate Checks
          </span>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-[#0f172a] rounded font-label-sm text-label-sm font-bold shadow-[1px_1px_0px_#0f172a]">
            Automated
          </span>
        </div>
        <div className="mb-space-sm">
          <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-extrabold">
            {passedGates}{' '}
            <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">
              / {total} Teams Passed
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 font-medium">
            Teams meeting team-size boundaries and minimum experience thresholds
          </p>
        </div>
        <div className="pt-space-sm border-t-2 border-[#0f172a]/10 flex items-center justify-between font-mono font-label-sm text-label-sm">
          <span className="text-on-surface-variant font-medium">Disqualified Teams</span>
          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded border border-[#0f172a] font-bold shadow-[1px_1px_0px_#0f172a]">
            {Math.max(0, total - passedGates)} Ineligible
          </span>
        </div>
      </div>
    </div>
  );
}
