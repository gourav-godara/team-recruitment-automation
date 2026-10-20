import { useState } from 'react';

export default function SchemaMappingTable({
  fields,
  onFieldMappingChange,
  onResetMap,
  onAutoAlign,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all'); // 'all' | 'required' | 'unmapped'
  const [showAllKeys, setShowAllKeys] = useState(false);
  const [isAligning, setIsAligning] = useState(false);

  // Compute counts
  const allCount = fields.length;
  const reqCount = fields.filter((f) => f.required).length;
  const unmappedCount = fields.filter((f) => f.status === 'unmapped').length;

  const handleAutoAlignClick = () => {
    setIsAligning(true);
    onAutoAlign();
    setTimeout(() => {
      setIsAligning(false);
    }, 650);
  };

  // Filter fields
  const filteredFields = fields.filter((f) => {
    // Search match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.key.toLowerCase().includes(q) ||
      f.path.toLowerCase().includes(q) ||
      f.source_column.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q);

    // Filter match
    let matchesFilter = true;
    if (currentFilter === 'required') matchesFilter = f.required;
    if (currentFilter === 'unmapped') matchesFilter = f.status === 'unmapped';

    return matchesSearch && matchesFilter;
  });

  // If not showing all keys and not searching/filtering unmapped, show top 7 primary keys (as in original mockup)
  const displayedFields =
    showAllKeys || searchQuery || currentFilter !== 'all'
      ? filteredFields
      : filteredFields.slice(0, 7);

  return (
    <div className="flex flex-col bg-surface-container-lowest rounded-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden mb-space-xl">
      {/* Table Interactive Toolbar */}
      <div className="p-space-md bg-surface-container border-b-2 border-[#0f172a] flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Field */}
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">
              search
            </span>
            <input
              id="schema-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter mapped fields..."
              className="w-full bg-surface-container-lowest border-2 border-[#0f172a] rounded-md pl-9 pr-3 py-1.5 font-body-sm text-body-sm focus:outline-none focus:shadow-[2px_2px_0px_#2563eb]"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-md border-2 border-[#0f172a]">
            <button
              type="button"
              id="filter-all"
              onClick={() => setCurrentFilter('all')}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                currentFilter === 'all'
                  ? 'bg-primary-container text-on-primary-container border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              All ({allCount})
            </button>
            <button
              type="button"
              id="filter-required"
              onClick={() => setCurrentFilter('required')}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                currentFilter === 'required'
                  ? 'bg-primary-container text-on-primary-container border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              Required ({reqCount})
            </button>
            <button
              type="button"
              id="filter-unmapped"
              onClick={() => setCurrentFilter('unmapped')}
              className={`px-2.5 py-1 rounded font-label-sm text-label-sm font-bold transition-all cursor-pointer flex items-center gap-1 ${
                currentFilter === 'unmapped'
                  ? 'bg-primary-container text-on-primary-container border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]'
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              <span>Unmapped</span>
              <span className="w-2 h-2 rounded-full bg-[#f43f5e]"></span>
              <span>({unmappedCount})</span>
            </button>
          </div>
        </div>

        {/* Tactical Quick-Action Buttons */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={onResetMap}
            className="px-3 py-1.5 rounded bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-surface-container active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all font-label-md text-label-md flex items-center gap-1 cursor-pointer font-bold"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reset Map
          </button>
          <button
            type="button"
            onClick={handleAutoAlignClick}
            className="px-3.5 py-1.5 rounded bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:bg-secondary-fixed-dim active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all font-label-md text-label-md font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Auto-Align Columns
          </button>
        </div>
      </div>

      {/* Dense Schema Matrix Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse" id="schema-table">
          <thead>
            <tr className="bg-[#0f172a] text-surface-container-lowest font-label-md text-label-md uppercase tracking-wider">
              <th className="py-3 px-4 border-r border-slate-700 w-12 text-center">#</th>
              <th className="py-3 px-4 border-r border-slate-700">Target Schema Field</th>
              <th className="py-3 px-4 border-r border-slate-700">Type</th>
              <th className="py-3 px-4 border-r border-slate-700">Req. Status</th>
              <th className="py-3 px-4 border-r border-slate-700 min-w-[220px]">
                Incoming CSV Column (Source)
              </th>
              <th className="py-3 px-4 border-r border-slate-700">Sample Row Specimen</th>
              <th className="py-3 px-4 text-center">Confidence Score</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[#0f172a] font-body-sm text-body-sm bg-surface-container-lowest" id="table-body">
            {displayedFields.map((field) => {
              const isUnmapped = field.status === 'unmapped' || field.source_column === '-- Unmapped --';
              return (
                <tr
                  key={field.id}
                  className={`hover:bg-[#fef08a] transition-colors group ${
                    isUnmapped ? 'bg-surface-container-low/40' : ''
                  }`}
                  data-name={`${field.key} ${field.path} ${field.source_column}`}
                  data-required={field.required ? 'true' : 'false'}
                  data-status={field.status}
                >
                  {/* Row Number */}
                  <td className="py-3 px-4 font-mono font-bold text-center text-on-surface-variant border-r-2 border-[#0f172a] group-hover:bg-[#fef08a]">
                    {String(field.id).padStart(2, '0')}
                  </td>

                  {/* Target Schema Field */}
                  <td className="py-3 px-4 border-r-2 border-[#0f172a]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center border border-[#0f172a] font-mono text-xs font-bold ${
                          field.badge_bg || 'bg-primary-fixed'
                        } ${field.badge_color || 'text-primary'}`}
                      >
                        {field.material_icon ? (
                          <span className="material-symbols-outlined text-sm leading-none">
                            {field.material_icon}
                          </span>
                        ) : (
                          field.badge_icon || '#'
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-on-surface text-sm">
                          {field.key}
                        </span>
                        <span className="text-xs text-on-surface-variant font-mono">
                          {field.path}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3 px-4 border-r-2 border-[#0f172a] font-mono text-xs font-semibold text-on-surface">
                    {field.type}
                  </td>

                  {/* Required Status */}
                  <td className="py-3 px-4 border-r-2 border-[#0f172a]">
                    {field.required ? (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
                        REQUIRED
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm border border-[#0f172a] font-bold">
                        OPTIONAL
                      </span>
                    )}
                  </td>

                  {/* Incoming CSV Column */}
                  <td className="py-3 px-4 border-r-2 border-[#0f172a]">
                    <select
                      value={field.source_column}
                      onChange={(e) => onFieldMappingChange(field.id, e.target.value)}
                      className={`w-full rounded p-1.5 font-mono text-xs font-semibold focus:outline-none transition-all cursor-pointer ${
                        isAligning ? 'bg-secondary-fixed' : ''
                      } ${
                        isUnmapped
                          ? 'bg-[#ffdad6] border-2 border-[#ba1a1a] text-[#93000a] font-bold shadow-[2px_2px_0px_#ba1a1a]'
                          : 'bg-surface-container-lowest border-2 border-[#0f172a] focus:bg-surface-bright'
                      }`}
                    >
                      {field.source_options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Sample Row Specimen */}
                  <td className="py-3 px-4 border-r-2 border-[#0f172a] font-mono text-xs text-on-surface">
                    {isUnmapped ? (
                      <span className="text-on-surface-variant italic">-- null payload --</span>
                    ) : (
                      <span className="bg-surface-container-low px-2 py-1 rounded border border-[#0f172a] block truncate max-w-[200px] font-bold">
                        {field.sample_value}
                      </span>
                    )}
                  </td>

                  {/* Confidence Score */}
                  <td className="py-3 px-4 text-center">
                    {field.confidence_type === 'verified' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10b981] text-surface-container-lowest font-label-sm text-label-sm border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        {field.confidence}
                      </span>
                    )}
                    {field.confidence_type === 'confident' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
                        <span className="material-symbols-outlined text-xs">bolt</span>
                        {field.confidence}
                      </span>
                    )}
                    {field.confidence_type === 'warning' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f43f5e] text-surface-container-lowest font-label-sm text-label-sm border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
                        <span className="material-symbols-outlined text-xs">warning</span>
                        {field.confidence}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Meta Bar */}
      <div className="p-space-sm bg-surface-container-low border-t-2 border-[#0f172a] flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant font-mono gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-on-surface">
            Showing {displayedFields.length} of {fields.length} schema keys.
          </span>
          {!showAllKeys && fields.length > 7 && (
            <button
              type="button"
              onClick={() => setShowAllKeys(true)}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              ({fields.length - 7} hidden optional parameters satisfied by defaults — click to view all)
            </button>
          )}
          {showAllKeys && (
            <button
              type="button"
              onClick={() => setShowAllKeys(false)}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              (Show top 7 primary view)
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>CSV Character Set: UTF-8 (BOM-free)</span>
          <span>•</span>
          <span className="text-[#10b981] font-bold">Schema v2.4 JSON-Schema Strict</span>
        </div>
      </div>
    </div>
  );
}
