export default function TelemetryCards() {
  const recruiterMetrics = [
    {
      label: 'EVALUATION SPEED',
      tag: 'INSTANT',
      tagColor: 'text-brand-blue',
      value: '<1s',
      unit: '',
      unitColor: 'text-brand-blue',
      subtitle: 'Automated deterministic ranking',
      bg: 'bg-white',
    },
    {
      label: 'SCORING CRITERIA',
      tag: '100% CONTROL',
      tagColor: 'text-emerald-700',
      value: 'Custom',
      unit: '',
      unitColor: 'text-emerald-700',
      subtitle: 'Configurable weights & eligibility rules',
      bg: 'bg-white',
    },
    {
      label: 'EXPLAINABILITY',
      tag: 'AUDITABLE',
      tagColor: 'text-purple-700',
      value: 'Defensible',
      unit: '',
      unitColor: 'text-purple-700',
      subtitle: 'Every shortlist decision clearly justified',
      bg: 'bg-white',
    },
    {
      label: 'EXPORT READY',
      tag: 'EXCEL & CSV',
      tagColor: 'text-amber-700',
      value: 'RFC 4180',
      unit: '',
      unitColor: 'text-amber-700',
      subtitle: '1-click spreadsheet download',
      bg: 'bg-brand-yellow/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {recruiterMetrics.map((item, idx) => (
        <div
          key={idx}
          className={`${item.bg} retro-border rounded-xl p-4 shadow-pop flex flex-col justify-between transition-transform hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
            <span>{item.label}</span>
            <span className={`${item.tagColor} font-bold`}>{item.tag}</span>
          </div>

          <div className="mt-2 font-display font-extrabold text-2xl text-brand-dark">
            {item.value}
            {item.unit && (
              <span className={`text-xl ${item.unitColor} font-bold ml-0.5`}>
                {item.unit}
              </span>
            )}
          </div>

          <span className="text-xs mt-1 font-medium text-slate-600">
            {item.subtitle}
          </span>
        </div>
      ))}
    </div>
  );
}
