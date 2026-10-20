export default function SanityChecklistCard({
  onNotifyCaptains,
  onViewQuarantinedIds,
  onInspectVideos,
}) {
  return (
    <div className="flex flex-col gap-space-md">
      {/* Sanity Checklist Bento Card */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a]">
        <div className="flex items-center justify-between pb-space-sm border-b-2 border-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary font-bold">task_alt</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-extrabold tracking-tight">
              Sanity Checklist
            </h3>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-full border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-mono font-bold">
            5/5 TESTS
          </span>
        </div>

        <div className="flex flex-col gap-space-sm mt-space-md">
          {/* Check 1: Zero Duplicate Team IDs */}
          <div className="p-space-sm rounded-lg bg-surface-container-low border border-[#0f172a]/20 flex items-start gap-space-sm">
            <div className="w-6 h-6 rounded-md bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] mt-0.5">
              <span className="material-symbols-outlined text-base font-bold">check</span>
            </div>
            <div>
              <span className="font-label-lg text-label-lg text-on-surface font-bold block">
                Zero Duplicate Team IDs
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs font-medium">
                482 unique SHA IDs verified across partition.
              </p>
            </div>
          </div>

          {/* Check 2: Member Emails Normalized */}
          <div className="p-space-sm rounded-lg bg-surface-container-low border border-[#0f172a]/20 flex items-start gap-space-sm">
            <div className="w-6 h-6 rounded-md bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] mt-0.5">
              <span className="material-symbols-outlined text-base font-bold">check</span>
            </div>
            <div>
              <span className="font-label-lg text-label-lg text-on-surface font-bold block">
                Member Emails Normalized
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs font-medium">
                1,640 hacker profiles canonicalized into UTF-8.
              </p>
            </div>
          </div>

          {/* Check 3: Warning 1 - 14 Private / 404 GitHub Repos */}
          <div className="p-space-sm rounded-lg bg-tertiary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex flex-col gap-2">
            <div className="flex items-start gap-space-sm">
              <div className="w-6 h-6 rounded-md bg-tertiary text-on-tertiary flex items-center justify-center shrink-0 border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] mt-0.5">
                <span className="material-symbols-outlined text-base font-bold">priority_high</span>
              </div>
              <div>
                <span className="font-label-lg text-label-lg text-on-tertiary-fixed block font-extrabold">
                  14 Private / 404 GitHub Repos
                </span>
                <p className="font-body-sm text-body-sm text-on-tertiary-fixed-variant text-xs font-medium leading-tight">
                  Direct API ping failed with HTTP 404 or HTTP 403 Forbidden.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 pl-8">
              <button
                type="button"
                onClick={onNotifyCaptains}
                className="font-label-sm text-label-sm px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer font-bold"
              >
                Flag &amp; Notify Captains
              </button>
              <button
                type="button"
                onClick={onViewQuarantinedIds}
                className="font-label-sm text-label-sm px-2.5 py-1 bg-tertiary text-on-tertiary rounded border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all cursor-pointer font-bold"
              >
                View 14 IDs
              </button>
            </div>
          </div>

          {/* Check 4: Warning 2 - 6 Restricted Demo Videos */}
          <div
            onClick={onInspectVideos}
            className="p-space-sm rounded-lg bg-secondary-fixed/50 border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-start gap-space-sm cursor-pointer hover:bg-secondary-fixed/70 transition-all"
            title="Click to view the 6 restricted video submissions"
          >
            <div className="w-6 h-6 rounded-md bg-secondary text-on-secondary flex items-center justify-center shrink-0 border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] mt-0.5">
              <span className="material-symbols-outlined text-base font-bold">lock</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg text-on-surface block font-extrabold">
                  6 Restricted Demo Videos
                </span>
                <span className="material-symbols-outlined text-xs text-on-surface">chevron_right</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs font-medium">
                Requires Google Drive or Loom authorization pass.
              </p>
            </div>
          </div>

          {/* Check 5: UTF-8 & Markdown Sanitized */}
          <div className="p-space-sm rounded-lg bg-surface-container-low border border-[#0f172a]/20 flex items-start gap-space-sm">
            <div className="w-6 h-6 rounded-md bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] mt-0.5">
              <span className="material-symbols-outlined text-base font-bold">check</span>
            </div>
            <div>
              <span className="font-label-lg text-label-lg text-on-surface font-bold block">
                UTF-8 &amp; Markdown Sanitized
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs font-medium">
                Zero dangerous XSS / prompt injection payloads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Triage Tip Sticker Card (Jury Policy Reminder) */}
      <div className="bg-secondary-fixed p-space-md rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] text-on-secondary-fixed relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined font-bold text-lg">tips_and_updates</span>
          <span className="font-label-lg text-label-lg uppercase tracking-wider font-extrabold">
            Jury Policy Reminder
          </span>
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-xs font-semibold">
          Teams flagged with <strong className="underline decoration-2">Hard Gate Repos</strong> will not be fed into the consensus rank matrix until unblocked. Proceeding will freeze their entry state.
        </p>
      </div>
    </div>
  );
}
