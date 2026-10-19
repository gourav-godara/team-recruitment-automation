import { useState } from 'react';

export default function NotifyCaptainsModal({ teams, onClose, onSent }) {
  const [isSending, setIsSending] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const blockedTeams = teams.filter((t) => t.status !== 'overridden');

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      if (onSent) {
        onSent(blockedTeams.length);
      }
      setTimeout(() => {
        onClose();
      }, 1400);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface-container-lowest border-2 border-[#0f172a] rounded-xl shadow-[8px_8px_0px_#0f172a] w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-secondary-fixed border-b-2 border-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
              <span className="material-symbols-outlined font-bold text-xl">forward_to_inbox</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-secondary-fixed font-black">
                Notify Captains: Hard Gate Repos
              </h3>
              <p className="font-body-sm text-xs text-on-secondary-fixed font-semibold">
                Dispatch urgent ping to {blockedTeams.length} captains with unresolvable GitHub repositories.
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

        {/* Content */}
        <div className="p-5 space-y-4">
          {sentSuccess ? (
            <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-xl border-2 border-emerald-800">
              <span className="material-symbols-outlined text-4xl text-emerald-600 animate-bounce">
                mark_email_read
              </span>
              <h4 className="font-headline-sm text-emerald-950 font-black">
                {blockedTeams.length} Automated Pings Dispatched!
              </h4>
              <p className="text-xs font-mono text-emerald-800">
                Captains have received a magic link to fix repo permissions before scoring window closes.
              </p>
            </div>
          ) : (
            <>
              {/* Email Preview Card */}
              <div className="bg-surface-container-low p-3.5 rounded-lg border-2 border-[#0f172a] text-xs font-mono space-y-2">
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant font-bold">Sender:</span>
                  <span className="text-on-surface">eval-jury-bot@shortlistiq.hackathon.org</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant font-bold">Recipients:</span>
                  <span className="text-on-surface font-bold text-tertiary">
                    {blockedTeams.length} Captains ({blockedTeams.map((t) => t.id).slice(0, 3).join(', ')}... and {blockedTeams.length - 3} more)
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant pb-2">
                  <span className="text-on-surface-variant font-bold">Subject:</span>
                  <span className="text-on-surface font-bold">
                    [Action Required] ETHGlobal Singapore 2025: GitHub Repository Access Failed (HTTP 404/403)
                  </span>
                </div>
                <div className="pt-1 text-on-surface-variant leading-relaxed">
                  <p>Hi Team Lead,</p>
                  <p className="mt-1">
                    During automated Data Quality parity checks, our scoring engine pinged your submitted GitHub repository and encountered an access failure.
                  </p>
                  <p className="mt-1 font-bold text-on-surface">
                    Failure status: Private repository or 404 URL Deadlock.
                  </p>
                  <p className="mt-1">
                    Please grant public read access or update your submission URL within 60 minutes to remain eligible for consensus ranking.
                  </p>
                </div>
              </div>

              {/* Optional Custom Note */}
              <div>
                <label className="font-label-sm text-label-sm uppercase text-on-surface font-bold block mb-1">
                  Optional Note from Jury Lead
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Please verify your team repo is set to Public under GitHub Repository Settings -> Danger Zone."
                  className="w-full p-2.5 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] text-xs font-mono focus:outline-none"
                  rows={2}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!sentSuccess && (
          <div className="p-4 bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="font-label-sm text-label-sm px-4 py-2 rounded-lg bg-surface-container text-on-surface border-2 border-[#0f172a] font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSending || blockedTeams.length === 0}
              onClick={handleSend}
              className="font-label-lg text-label-lg px-5 py-2.5 rounded-lg bg-primary text-on-primary border-2 border-[#0f172a] shadow-[3px_3px_0px_#0f172a] font-black cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                  <span>Dispatching {blockedTeams.length} Emails...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Dispatch Batch Notification ({blockedTeams.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
