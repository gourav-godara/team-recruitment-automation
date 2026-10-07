import { telemetryMetrics } from '../../data/mockTeams';

export default function TelemetryCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {telemetryMetrics.map((item, idx) => (
        <div
          key={idx}
          className={`${item.bg} retro-border rounded-xl p-4 shadow-pop flex flex-col justify-between transition-transform hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-500">
            <span>{item.label}</span>
            <span className={`${item.tagColor} font-bold`}>{item.tag}</span>
          </div>

          <div className="mt-2 font-display font-extrabold text-3xl text-brand-dark">
            {item.value}
            {item.unit && (
              <span className={`text-xl ${item.unitColor} font-bold ml-0.5`}>
                {item.unit}
              </span>
            )}
          </div>

          <span
            className={`text-xs mt-1 ${
              item.isSpecial
                ? 'font-mono font-bold text-slate-700 truncate'
                : 'font-medium text-slate-600'
            }`}
          >
            {item.subtitle}
          </span>
        </div>
      ))}
    </div>
  );
}
