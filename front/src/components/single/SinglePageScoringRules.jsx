import { useState, useMemo } from 'react';

export default function SinglePageScoringRules({
  dataset,
  isEvaluating,
  onRunEvaluation,
  errorMessage,
}) {
  // 4 Core Criteria Weights (sum to 100)
  const [weights, setWeights] = useState({
    experience_years: 35,
    github: 35,
    skills: 20,
    presentation: 10,
  });

  // Shortlist quota
  const [topQuota, setTopQuota] = useState(5);

  // Aggregation Strategy
  const [aggregation, setAggregation] = useState('AVERAGE');

  // Hard Gates
  const [gates, setGates] = useState({
    team_size: true,
    diversity: false,
    min_experience: false,
    github_required: true,
  });

  // Weight total
  const totalWeight = useMemo(() => {
    return (
      (weights.experience_years || 0) +
      (weights.github || 0) +
      (weights.skills || 0) +
      (weights.presentation || 0)
    );
  }, [weights]);

  const isBalanced = Math.abs(totalWeight - 100) < 0.5;

  // Presets
  const applyPreset = (preset) => {
    if (preset === 'balanced') {
      setWeights({ experience_years: 35, github: 35, skills: 20, presentation: 10 });
    } else if (preset === 'code_first') {
      setWeights({ experience_years: 20, github: 50, skills: 25, presentation: 5 });
    } else if (preset === 'exp_first') {
      setWeights({ experience_years: 50, github: 25, skills: 15, presentation: 10 });
    }
  };

  // Auto Balance weights to exactly 100%
  const handleAutoBalance = () => {
    const sum = totalWeight || 1;
    const wExp = Math.round((weights.experience_years / sum) * 100);
    const wGh = Math.round((weights.github / sum) * 100);
    const wSk = Math.round((weights.skills / sum) * 100);
    const wPres = 100 - (wExp + wGh + wSk);
    setWeights({
      experience_years: wExp,
      github: wGh,
      skills: wSk,
      presentation: Math.max(0, wPres),
    });
  };

  const handleSliderChange = (key, val) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Number(val),
    }));
  };

  const handleToggleGate = (gateKey) => {
    setGates((prev) => ({
      ...prev,
      [gateKey]: !prev[gateKey],
    }));
  };

  const handleTriggerEvaluation = () => {
    if (!isBalanced) {
      handleAutoBalance();
    }

    // Build configuration object
    const normalizedWeights = {
      experience_years: Number((weights.experience_years / 100).toFixed(4)),
      github_composite_score: Number((weights.github / 100).toFixed(4)),
      skills: Number((weights.skills / 100).toFixed(4)),
      presentation: Number((weights.presentation / 100).toFixed(4)),
    };

    const activeRules = [];
    if (gates.team_size) {
      activeRules.push({
        name: 'Team Size Bounds [2-5]',
        scope: 'TEAM',
        field: 'team_size',
        operator: 'BETWEEN',
        value: [2, 5],
      });
    }
    if (gates.diversity) {
      activeRules.push({
        name: 'Diversity Requirement (Min 1 Female)',
        scope: 'MEMBER',
        field: 'declared_gender',
        operator: '==',
        value: 'F',
        aggregation: 'ANY',
      });
    }
    if (gates.min_experience) {
      activeRules.push({
        name: 'Lead Experience (>= 2 Years)',
        scope: 'MEMBER',
        field: 'experience_years',
        operator: '>=',
        value: 2.0,
        aggregation: 'ANY',
      });
    }
    if (gates.github_required) {
      activeRules.push({
        name: 'Valid GitHub Profile Provided',
        scope: 'MEMBER',
        field: 'github_url',
        operator: '!=',
        value: '',
        aggregation: 'ANY',
      });
    }

    onRunEvaluation({
      topX: Number(topQuota) || 5,
      weights: normalizedWeights,
      rules: activeRules,
      aggregation,
    });
  };

  return (
    <section id="scoring-section" className="scroll-mt-20 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b-4 border-[#0F172A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-brand-yellow text-[#0F172A] font-mono font-bold text-xs border-2 border-[#0F172A] flex items-center justify-center shadow-[2px_2px_0px_#0F172A]">
              03
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-brand-dark">
              DECISION ENGINE SCORING & HARD GATES
            </span>
          </div>
          <h2 className="font-display font-black text-2xl md:text-3xl text-[#0F172A] mt-1">
            Recruiter Weights & Eligibility Rules
          </h2>
          <p className="text-sm font-sans text-slate-600 font-medium">
            Fine-tune criteria importance, shortlist quotas, and non-negotiable eligibility gates.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <span className="text-xs font-mono font-bold text-slate-500 uppercase">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('balanced')}
            className="px-2.5 py-1 bg-white hover:bg-yellow-100 text-[#0F172A] text-xs font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] cursor-pointer"
          >
            ⚖️ Balanced
          </button>
          <button
            type="button"
            onClick={() => applyPreset('code_first')}
            className="px-2.5 py-1 bg-white hover:bg-yellow-100 text-[#0F172A] text-xs font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] cursor-pointer"
          >
            💻 Code-First
          </button>
          <button
            type="button"
            onClick={() => applyPreset('exp_first')}
            className="px-2.5 py-1 bg-white hover:bg-yellow-100 text-[#0F172A] text-xs font-mono font-bold rounded-lg border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] cursor-pointer"
          >
            📈 Experience
          </button>
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Rules & Quota on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Criteria Sliders */}
        <div className="lg:col-span-7 bg-white rounded-2xl border-3 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A] flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
            <h3 className="font-display font-black text-lg text-[#0F172A] flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-blue font-bold text-xl">
                tune
              </span>
              <span>Scoring Criteria Multipliers</span>
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] ${
                  isBalanced
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-rose-100 text-rose-900 animate-pulse'
                }`}
              >
                Sum: {totalWeight}% {isBalanced ? '✓' : '(Must be 100%)'}
              </span>
              {!isBalanced && (
                <button
                  type="button"
                  onClick={handleAutoBalance}
                  className="px-2.5 py-1 bg-brand-yellow hover:bg-yellow-300 text-xs font-mono font-bold rounded-xl border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] cursor-pointer"
                >
                  Balance
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Slider 1: GitHub Activity */}
            <div className="flex flex-col gap-2 p-3.5 bg-slate-50 rounded-xl border-2 border-[#0F172A]">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-blue text-lg">
                    code
                  </span>
                  <span>GitHub & Code Quality</span>
                </span>
                <span className="font-mono font-black text-sm bg-brand-blue text-white px-2.5 py-0.5 rounded-lg border border-[#0F172A]">
                  {weights.github}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={weights.github}
                onChange={(e) => handleSliderChange('github', e.target.value)}
                className="w-full accent-brand-blue cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[11px] font-sans text-slate-500">
                Inspects public commits, repositories, and technical velocity.
              </span>
            </div>

            {/* Slider 2: Experience Years */}
            <div className="flex flex-col gap-2 p-3.5 bg-slate-50 rounded-xl border-2 border-[#0F172A]">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-lg">
                    trending_up
                  </span>
                  <span>Relevant Professional Experience</span>
                </span>
                <span className="font-mono font-black text-sm bg-emerald-600 text-white px-2.5 py-0.5 rounded-lg border border-[#0F172A]">
                  {weights.experience_years}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={weights.experience_years}
                onChange={(e) => handleSliderChange('experience_years', e.target.value)}
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[11px] font-sans text-slate-500">
                Normalized applicant years of software development experience.
              </span>
            </div>

            {/* Slider 3: Technical Skills Match */}
            <div className="flex flex-col gap-2 p-3.5 bg-slate-50 rounded-xl border-2 border-[#0F172A]">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-700 text-lg">
                    psychology
                  </span>
                  <span>Technical Skills Match</span>
                </span>
                <span className="font-mono font-black text-sm bg-purple-600 text-white px-2.5 py-0.5 rounded-lg border border-[#0F172A]">
                  {weights.skills}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={weights.skills}
                onChange={(e) => handleSliderChange('skills', e.target.value)}
                className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[11px] font-sans text-slate-500">
                Matches candidate declared skills with project technology stack.
              </span>
            </div>

            {/* Slider 4: Presentation & Track Pitch */}
            <div className="flex flex-col gap-2 p-3.5 bg-slate-50 rounded-xl border-2 border-[#0F172A]">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-sm text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-700 text-lg">
                    campaign
                  </span>
                  <span>Presentation & Hackathon Track</span>
                </span>
                <span className="font-mono font-black text-sm bg-rose-600 text-white px-2.5 py-0.5 rounded-lg border border-[#0F172A]">
                  {weights.presentation}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={weights.presentation}
                onChange={(e) => handleSliderChange('presentation', e.target.value)}
                className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <span className="text-[11px] font-sans text-slate-500">
                Pitch alignment, track relevance, and hackathon project demo.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Quota & Hard Gate Toggles */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Top Quota Card */}
          <div className="bg-white rounded-2xl border-3 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
              <h3 className="font-display font-black text-lg text-[#0F172A] flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 font-bold text-xl">
                  military_tech
                </span>
                <span>Shortlist Quota (Top X)</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-mono font-bold text-xs border border-[#0F172A]">
                Top {topQuota} Teams
              </span>
            </div>

            <p className="text-xs font-sans text-slate-600 mt-2 mb-3">
              How many top-ranked teams should be advanced into the final interview shortlist?
            </p>

            <div className="flex items-center gap-2">
              {[3, 5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTopQuota(num)}
                  className={`flex-1 py-2 font-mono font-black text-xs rounded-xl border-2 border-[#0F172A] transition-all cursor-pointer ${
                    topQuota === num
                      ? 'bg-brand-yellow text-[#0F172A] shadow-[3px_3px_0px_#0F172A] -translate-y-0.5'
                      : 'bg-slate-50 hover:bg-yellow-50 text-slate-700'
                  }`}
                >
                  Top {num}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-slate-200">
              <label className="font-mono text-xs font-bold text-slate-600 uppercase">
                Team Aggregation Strategy:
              </label>
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value)}
                className="py-1.5 px-3 rounded-xl border-2 border-[#0F172A] font-mono text-xs font-bold bg-slate-50 focus:outline-none cursor-pointer"
              >
                <option value="AVERAGE">Average Member Score (Equal Contribution)</option>
                <option value="TOP_PERFORMER">Top Performer Weighted (70/30)</option>
                <option value="HARMONIC">Harmonic Mean (Balanced Squad)</option>
              </select>
            </div>
          </div>

          {/* Hard Gates Card */}
          <div className="bg-white rounded-2xl border-3 border-[#0F172A] p-6 shadow-[5px_5px_0px_#0F172A] flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
                <h3 className="font-display font-black text-lg text-[#0F172A] flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-600 font-bold text-xl">
                    gavel
                  </span>
                  <span>Non-Negotiable Eligibility Gates</span>
                </h3>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                {/* Gate 1: Team Size */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border-2 border-[#0F172A] cursor-pointer hover:bg-yellow-50/50">
                  <div className="flex flex-col pr-3">
                    <span className="font-display font-bold text-xs text-[#0F172A]">
                      Team Size Bounds [2 to 5 members]
                    </span>
                    <span className="text-[11px] font-sans text-slate-500">
                      Disqualifies solo applicants or oversized teams.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gates.team_size}
                    onChange={() => handleToggleGate('team_size')}
                    className="w-5 h-5 accent-brand-dark rounded cursor-pointer"
                  />
                </label>

                {/* Gate 2: Gender Diversity */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border-2 border-[#0F172A] cursor-pointer hover:bg-yellow-50/50">
                  <div className="flex flex-col pr-3">
                    <span className="font-display font-bold text-xs text-[#0F172A]">
                      Gender Diversity Rule
                    </span>
                    <span className="text-[11px] font-sans text-slate-500">
                      Requires at least one female candidate per team.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gates.diversity}
                    onChange={() => handleToggleGate('diversity')}
                    className="w-5 h-5 accent-brand-dark rounded cursor-pointer"
                  />
                </label>

                {/* Gate 3: Minimum Experience */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border-2 border-[#0F172A] cursor-pointer hover:bg-yellow-50/50">
                  <div className="flex flex-col pr-3">
                    <span className="font-display font-bold text-xs text-[#0F172A]">
                      Experienced Lead Floor (2+ Years Minimum)
                    </span>
                    <span className="text-[11px] font-sans text-slate-500">
                      Requires at least 1 member with professional track record.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gates.min_experience}
                    onChange={() => handleToggleGate('min_experience')}
                    className="w-5 h-5 accent-brand-dark rounded cursor-pointer"
                  />
                </label>

                {/* Gate 4: GitHub Link Required */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border-2 border-[#0F172A] cursor-pointer hover:bg-yellow-50/50">
                  <div className="flex flex-col pr-3">
                    <span className="font-display font-bold text-xs text-[#0F172A]">
                      Valid GitHub Profile Mandatory
                    </span>
                    <span className="text-[11px] font-sans text-slate-500">
                      Disqualifies teams where zero code links were provided.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={gates.github_required}
                    onChange={() => handleToggleGate('github_required')}
                    className="w-5 h-5 accent-brand-dark rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
              * Ineligible teams receive an explicit explanation and cannot be shortlisted.
            </div>
          </div>
        </div>
      </div>

      {/* Execution Trigger Bar */}
      <div className="bg-brand-yellow rounded-2xl border-4 border-[#0F172A] p-6 shadow-[6px_6px_0px_#0F172A] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-xl text-[#0F172A]">
              Execute Deterministic Decision Engine
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#0F172A] text-xs font-mono font-bold border border-[#0F172A]">
              {dataset ? `${dataset.total_teams || 0} Teams Ready` : 'Ready'}
            </span>
          </div>
          <p className="text-xs font-sans text-slate-800 font-medium max-w-xl">
            Calculates composite scores, checks hard gates, ranks contenders, and produces plain-English explanations.
          </p>
          {errorMessage && (
            <div className="mt-1 text-xs font-mono font-bold text-rose-800 bg-rose-100 p-2 rounded-lg border border-rose-400">
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isEvaluating}
          onClick={handleTriggerEvaluation}
          className="w-full md:w-auto px-8 py-4 bg-brand-blue hover:bg-blue-700 text-white font-display font-black text-base md:text-lg rounded-2xl border-3 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0F172A] active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {isEvaluating ? (
            <>
              <span className="material-symbols-outlined text-2xl animate-spin">
                progress_activity
              </span>
              <span>Evaluating Teams...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl font-bold">
                bolt
              </span>
              <span>RUN DECISION ENGINE</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
