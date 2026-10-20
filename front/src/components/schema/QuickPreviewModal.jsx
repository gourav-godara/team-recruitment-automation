import { useState } from 'react';

export default function QuickPreviewModal({ onClose, rows = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = rows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      (r.team_name && r.team_name.toLowerCase().includes(q)) ||
      (r.external_id && r.external_id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest retro-border-thick rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-[8px_8px_0px_#0f172a] overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-brand-yellow border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold text-on-surface">
              visibility
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold leading-tight">
                Candidate Dataset Preview
              </h3>
              <p className="font-mono text-xs text-on-surface font-semibold">
                Uploaded registration records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-bold text-lg hover:bg-rose-200 cursor-pointer transition-all"
          >
            ✕
          </button>
        </div>

        {/* Search bar inside modal */}
        <div className="p-3 bg-surface-container border-b-2 border-[#0f172a] flex items-center justify-between gap-4">
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search preview records..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest rounded-lg border-2 border-[#0f172a] font-mono text-xs focus:outline-none"
            />
          </div>
          <span className="font-mono text-xs font-bold text-slate-500">
            {filtered.length} records found
          </span>
        </div>

        {/* Table content */}
        <div className="overflow-y-auto p-4 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              No matching records in preview.
            </div>
          ) : (
            <table className="w-full font-mono text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#0f172a] bg-slate-100">
                  <th className="p-2 font-bold">Team Name</th>
                  <th className="p-2 font-bold">Candidate</th>
                  <th className="p-2 font-bold">Email</th>
                  <th className="p-2 font-bold">Experience</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((r, idx) => (
                  <tr key={idx} className="hover:bg-yellow-50">
                    <td className="p-2 font-bold text-brand-dark">{r.team_name}</td>
                    <td className="p-2">{r.name || r.candidate_name || '--'}</td>
                    <td className="p-2">{r.email || '--'}</td>
                    <td className="p-2">{r.experience_years ? `${r.experience_years} yrs` : '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
