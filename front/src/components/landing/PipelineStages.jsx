export default function PipelineStages() {
  const steps = [
    {
      step: '01',
      title: 'Upload Registrations CSV',
      description: 'Upload your candidate registration spreadsheet. The system groups team members by team name and checks column mappings.',
      icon: 'upload_file',
      color: 'bg-brand-blue text-white',
      cardBg: 'bg-[#EEF2FF]',
    },
    {
      step: '02',
      title: 'Verify Data Quality',
      description: 'Automatically detects missing emails, GitHub URLs, or incomplete submissions. Alerts you to team size bounds (e.g. 2-4 members).',
      icon: 'verified',
      color: 'bg-emerald-600 text-white',
      cardBg: 'bg-[#ECFDF5]',
    },
    {
      step: '03',
      title: 'Configure Scoring Criteria',
      description: 'Set your recruitment priorities with intuitive sliders: Years of Experience, GitHub Activity, Skills Match, and Presentation.',
      icon: 'tune',
      color: 'bg-amber-500 text-brand-dark',
      cardBg: 'bg-[#FFFBEB]',
    },
    {
      step: '04',
      title: 'Review Shortlist & Export',
      description: 'Inspect the transparent leaderboard. Every team gets a rank, a total score, and a human-readable explanation of why they were shortlisted.',
      icon: 'leaderboard',
      color: 'bg-brand-purple text-white',
      cardBg: 'bg-[#FAF5FF]',
    },
  ];

  return (
    <section className="w-full px-4 py-16 bg-white retro-border border-x-0" id="pipeline-stages">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2 max-w-2xl">
            <span className="px-3 py-1 self-start rounded-full text-xs font-mono font-extrabold bg-brand-yellow text-brand-dark retro-border shadow-pop-sm">
              EVALUATION WORKFLOW
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-brand-dark">
              How the Shortlisting Engine Works
            </h2>
            <p className="font-sans text-base text-slate-600 font-medium">
              Transform raw candidate spreadsheets into an auditable, transparent shortlisting leaderboard in four clear steps.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs font-bold bg-brand-cream px-3 py-2 rounded-xl retro-border shadow-pop-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ENGINE: READY</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s) => (
            <div
              key={s.step}
              className={`${s.cardBg} retro-border rounded-2xl p-6 shadow-pop-card flex flex-col justify-between gap-4 transition-transform hover:-translate-y-1`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs retro-border shadow-pop-sm ${s.color}`}>
                    STEP {s.step}
                  </span>
                  <span className="material-symbols-outlined text-2xl text-brand-dark font-bold">
                    {s.icon}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-xl text-brand-dark">
                  {s.title}
                </h3>
                <p className="font-sans text-sm text-slate-700 leading-relaxed font-medium">
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
