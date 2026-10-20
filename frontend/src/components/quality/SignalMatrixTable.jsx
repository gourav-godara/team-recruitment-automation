export default function SignalMatrixTable({ vectors, onVectorSelect }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden">
      {/* Table Header Strip */}
      <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm border-b-2 border-[#0f172a]">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
            Field-Level Signal Matrix
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Deterministic policy per rubric dimension.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm px-2.5 py-1 bg-surface-container-lowest rounded-full border border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-bold text-on-surface">
            {vectors.length} Monitored Vectors
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-inverse-surface text-inverse-on-surface font-label-md text-label-md">
              <th className="py-3 px-4 font-bold">Field Attribute</th>
              <th className="py-3 px-3 text-center font-bold">Weight</th>
              <th className="py-3 px-3 text-center font-bold">Missing</th>
              <th className="py-3 px-4 w-44 font-bold">% Null Ratio</th>
              <th className="py-3 px-3 font-bold">Handling Strategy</th>
              <th className="py-3 px-4 font-bold">Imputation Policy</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-surface-container font-body-sm text-body-sm">
            {vectors.map((vec) => {
              // Missing pill styles
              let missingClass = 'bg-surface-container-highest text-on-surface';
              if (vec.attribute === 'github_repo_url') {
                missingClass = 'bg-tertiary-fixed text-on-tertiary-fixed';
              } else if (vec.attribute === 'demo_video_url') {
                missingClass = 'bg-secondary-fixed text-on-secondary-fixed';
              } else if (vec.attribute === 'team_size') {
                missingClass = 'bg-surface-container-high text-on-surface';
              }

              // Handling strategy badge styles
              let badgeClass = 'bg-surface-container-high text-on-surface';
              if (vec.handlingStrategy === 'Hard Gate') {
                badgeClass = 'bg-tertiary text-on-tertiary';
              } else if (vec.handlingStrategy === 'Dashed Unknown') {
                badgeClass = 'bg-secondary-fixed text-on-secondary-fixed';
              } else if (vec.handlingStrategy === 'Exact Integer') {
                badgeClass = 'bg-surface-container-highest text-on-surface';
              } else if (vec.handlingStrategy === 'Bayesian Prior') {
                badgeClass = 'bg-primary-fixed text-on-primary-fixed';
              } else if (vec.handlingStrategy === 'Dynamic Weight') {
                badgeClass = 'bg-surface-container-high text-on-surface';
              }

              return (
                <tr
                  key={vec.id}
                  onClick={() => onVectorSelect && onVectorSelect(vec)}
                  className="hover:bg-secondary-fixed/20 transition-colors cursor-pointer group"
                  title="Click to inspect imputation formula and database policy"
                >
                  {/* Field Attribute */}
                  <td className="py-3.5 px-4 font-mono font-bold text-on-surface">
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-base font-bold ${vec.iconColor}`}>
                        {vec.icon}
                      </span>
                      <span className="group-hover:text-primary transition-colors">
                        {vec.attribute}
                      </span>
                    </div>
                  </td>

                  {/* Weight */}
                  <td className="py-3.5 px-3 text-center font-mono font-bold text-on-surface">
                    {vec.weight}
                  </td>

                  {/* Missing Count */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`font-label-sm text-label-sm px-2 py-0.5 font-mono font-bold rounded border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] ${missingClass}`}
                    >
                      {vec.missing}
                    </span>
                  </td>

                  {/* % Null Ratio */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-surface-container-high h-2.5 rounded-full overflow-hidden border border-[#0f172a]/20">
                        <div
                          className={`${vec.barColor} h-full`}
                          style={{ width: `${Math.min(100, Math.max(vec.nullRatio, vec.nullRatio > 0 ? 3 : 0))}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-xs text-on-surface font-bold">
                        {vec.nullRatio.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Handling Strategy Badge */}
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-label-sm text-label-sm px-2 py-1 rounded-full border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold whitespace-nowrap ${badgeClass}`}
                    >
                      {vec.handlingStrategy}
                    </span>
                  </td>

                  {/* Imputation Policy Note */}
                  <td className="py-3.5 px-4 text-on-surface-variant font-mono text-xs font-medium">
                    <div className="flex items-center justify-between">
                      <span>{vec.imputationPolicy}</span>
                      <span className="material-symbols-outlined text-xs text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                        info
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
