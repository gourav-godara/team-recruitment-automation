export default function RestrictedVideosModal({ videos, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface-container-lowest border-2 border-[#0f172a] rounded-xl shadow-[8px_8px_0px_#0f172a] w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-secondary-fixed/80 border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
              <span className="material-symbols-outlined font-bold text-xl text-secondary">lock</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-black">
                  6 Restricted Demo Video Submissions
                </h3>
                <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 bg-secondary text-on-secondary rounded-full border border-[#0f172a] shadow-[1px_1px_0px_#0f172a] font-bold">
                  Soft Vector Alert
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs font-semibold">
                Videos require authentication passcodes or Google Drive organization sharing permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-bold text-on-surface cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* List of videos */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="p-3.5 rounded-xl bg-surface-container-low border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-surface-container border border-[#0f172a]">
                    {vid.id}
                  </span>
                  <span className="font-headline-sm text-sm text-on-surface font-extrabold">
                    {vid.team_name}
                  </span>
                </div>
                <div className="text-xs font-mono text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">link</span>
                  <span className="truncate max-w-sm">{vid.video_url}</span>
                </div>
                <div className="text-xs font-semibold text-secondary">
                  🔒 {vid.restriction_type}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <a
                  href={`mailto:${vid.captain_email}?subject=ETHGlobal Singapore Video Link Access Required`}
                  className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] hover:bg-secondary-fixed transition-all font-bold cursor-pointer"
                >
                  Email Lead
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
          <span className="text-xs font-mono text-on-surface-variant font-semibold">
            Handling Strategy: Dashed Unknown (-0.5 neutral penalty applied until resolved)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-label-lg text-label-lg px-5 py-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-black cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
