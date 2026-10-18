import { useState } from 'react';
import { mockPreviewRows } from '../../data/mockSchema';

export default function QuickPreviewModal({ onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockPreviewRows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.team_name.toLowerCase().includes(q) ||
      r.track.toLowerCase().includes(q) ||
      r.external_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest retro-border-thick rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-[8px_8px_0px_#0f172a] overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-secondary-fixed border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold text-on-surface">
              visibility
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold leading-tight">
                Quick Preview Specimen (First 50 Rows)
              </h3>
              <p className="font-mono text-xs text-on-surface font-semibold">
                Source: submissions_final_v3.csv (482 total rows) • Raw CSV Stream
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
              placeholder="Search sample preview rows..."
              className="w-full bg-white border-2 border-[#0f172a] rounded-md pl-9 pr-3 py-1 font-body-sm text-xs focus:outline-none focus:shadow-[2px_2px_0px_#2563eb]"
            />
          </div>
          <span className="font-mono text-xs text-on-surface-variant font-bold">
            Showing {filtered.length} of 50 sampled rows
          </span>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1 p-2">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-[#0f172a] text-white uppercase tracking-wider">
                <th className="py-2 px-3 border-r border-slate-700">#</th>
                <th className="py-2 px-3 border-r border-slate-700">Submission ID</th>
                <th className="py-2 px-3 border-r border-slate-700">Project Title</th>
                <th className="py-2 px-3 border-r border-slate-700">Primary Category</th>
                <th className="py-2 px-3 border-r border-slate-700">Repo Link</th>
                <th className="py-2 px-3 border-r border-slate-700">Prelim Tech</th>
                <th className="py-2 px-3 border-r border-slate-700">Commits</th>
                <th className="py-2 px-3">Team Size</th>
              </tr>
            </thead>
            <tbody className="divide-y border-b-2 border-[#0f172a] bg-white">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-[#fef08a] transition-colors">
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">{row.id}</td>
                  <td className="py-2 px-3 border-r border-slate-200 text-primary font-bold">
                    {row.external_id}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-on-surface">
                    {row.team_name}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high border border-[#0f172a] text-[10px] font-bold">
                      {row.track}
                    </span>
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 text-slate-600 truncate max-w-[180px]">
                    {row.repo_link}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold text-emerald-700">
                    {row.tech_score}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">{row.commits}</td>
                  <td className="py-2 px-3 font-bold">{row.team_size} members</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between text-xs font-mono">
          <span className="text-on-surface-variant font-bold">
            Parsed cleanly via WebAssembly SIMD CSV Lexer. Zero delimiter drift.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-primary text-white font-bold border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-primary-container cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
