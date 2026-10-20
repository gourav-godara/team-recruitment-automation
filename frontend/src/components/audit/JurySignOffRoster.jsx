import { useState } from 'react';
import { mockJurySigners } from '../../data/mockAudit';

export default function JurySignOffRoster({ signers = mockJurySigners }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopySig = (judge) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(judge.full_signature || judge.signature);
      setCopiedId(judge.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-xl p-space-lg border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] mb-space-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-md border-b-2 border-outline-variant gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-secondary-fixed border border-[#0f172a] rounded-sm"></span>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-extrabold">
              Final Jury Sign-Off Roster
            </h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Cryptographically authenticated signatures from all track leads required to authorize the live publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm px-3 py-1 bg-[#10b981] text-on-primary rounded-full border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-black uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-sm font-bold">verified</span>
            <span>Quorum Met (4 of 4 Leads)</span>
          </span>
        </div>
      </div>

      {/* 4 Lead Jury Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md mt-space-md">
        {signers.map((judge) => (
          <div
            key={judge.id}
            className="bg-surface-container-low p-space-md rounded-lg border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] hover:shadow-[4px_4px_0px_#0f172a] transition-all flex flex-col justify-between relative group"
          >
            <div>
              {/* Profile Image & Metadata */}
              <div className="flex items-center gap-space-sm mb-3">
                <div className="relative shrink-0">
                  <img
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]"
                    src={judge.avatar}
                    alt={judge.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                  <div
                    style={{ display: 'none' }}
                    className="w-11 h-11 rounded-full bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] items-center justify-center font-bold text-sm font-mono"
                  >
                    {judge.fallback_initials || judge.name.slice(0, 2)}
                  </div>
                </div>

                <div>
                  <div className="font-label-lg text-label-lg text-on-surface font-extrabold leading-tight">
                    {judge.name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                    {judge.role}
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">Status:</span>
                  <span className="font-bold text-[#10b981] flex items-center gap-1 font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                    <span>{judge.status}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">Timestamp:</span>
                  <span className="font-mono text-on-surface font-semibold text-[11px]">
                    {judge.timestamp}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature snippet pill */}
            <button
              type="button"
              onClick={() => handleCopySig(judge)}
              className="p-2 bg-surface-container-lowest hover:bg-secondary-fixed/20 rounded border border-[#0f172a] font-mono text-[10px] text-on-surface-variant hover:text-on-surface flex items-center justify-between w-full transition-colors cursor-pointer text-left"
              title="Click to copy cryptographic signature"
            >
              <span className="truncate">{judge.signature}</span>
              <span className="material-symbols-outlined text-xs shrink-0 ml-1">
                {copiedId === judge.id ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
