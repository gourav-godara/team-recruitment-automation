import { useState, useEffect } from 'react';
import { getCampaigns, createCampaign } from '../../api/client';
import { useApp } from '../../context/AppContext';

export default function CampaignsModal({ isOpen, onClose }) {
  const { campaignId, setCampaignId } = useApp();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // New campaign form state
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
    }
  }, [isOpen]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createCampaign({ name: newCampaignName.trim() });
      setCampaigns((prev) => [created, ...prev]);
      setCampaignId(created.id);
      setNewCampaignName('');
    } catch (err) {
      setCreateError(err.message || 'Failed to create campaign.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectCampaign = (id) => {
    setCampaignId(id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl border-2 border-[#0f172a] shadow-[6px_6px_0px_#0f172a] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary-container px-space-lg py-4 border-b-2 border-[#0f172a] flex items-center justify-between text-on-primary-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-bold">event_note</span>
            <div>
              <h2 className="font-headline-sm text-lg font-black tracking-tight">
                Recruitment Campaigns
              </h2>
              <p className="font-body-sm text-xs font-semibold text-on-primary-container/80">
                Group and partition your hackathon datasets and evaluations
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] flex items-center justify-center font-bold hover:bg-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-space-lg flex flex-col gap-space-md max-h-[65vh] overflow-y-auto">
          {/* Create Campaign Form */}
          <form onSubmit={handleCreateCampaign} className="p-3 rounded-xl bg-surface-container-low border-2 border-[#0f172a] flex flex-col gap-2">
            <span className="font-label-sm text-xs uppercase font-extrabold text-on-surface">
              Create New Campaign
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="e.g. ACM Hackathon 2026, Summer Internship Intake..."
                className="flex-1 px-3 py-2 rounded-lg bg-surface-container-lowest border-2 border-[#0f172a] text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isCreating}
              />
              <button
                type="submit"
                disabled={isCreating || !newCampaignName.trim()}
                className="px-4 py-2 rounded-lg bg-secondary-fixed text-on-secondary-fixed border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] font-bold text-xs uppercase hover:bg-secondary-fixed/90 disabled:opacity-50 cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>{isCreating ? 'Creating...' : 'Create'}</span>
              </button>
            </div>
            {createError && (
              <p className="text-xs text-rose-600 font-semibold mt-1">⚠️ {createError}</p>
            )}
          </form>

          {/* Loading State */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">
                progress_activity
              </span>
              <span className="font-mono text-xs font-bold">Loading campaigns from backend...</span>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-base font-bold shrink-0">error</span>
              <div className="flex-1">
                <span className="font-bold block">Error loading campaigns:</span>
                <p className="mt-0.5">{error}</p>
                <button
                  type="button"
                  onClick={fetchCampaigns}
                  className="mt-2 px-3 py-1 bg-white rounded border border-rose-600 font-bold hover:bg-rose-100 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && campaigns.length === 0 && (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-center bg-surface-container-low rounded-xl border-2 border-dashed border-[#0f172a]/30 p-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">
                folder_off
              </span>
              <span className="font-bold text-sm text-on-surface">No campaigns found</span>
              <p className="text-xs text-on-surface-variant max-w-sm">
                Create your first recruitment campaign above to organize your registration datasets.
              </p>
            </div>
          )}

          {/* Campaigns List */}
          {!loading && !error && campaigns.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-xs uppercase font-extrabold text-on-surface-variant">
                Select Active Campaign ({campaigns.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campaigns.map((camp) => {
                  const isSelected = String(camp.id) === String(campaignId);
                  const dateStr = camp.created_at
                    ? new Date(camp.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={camp.id}
                      onClick={() => handleSelectCampaign(camp.id)}
                      className={`p-3 rounded-xl border-2 border-[#0f172a] transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        isSelected
                          ? 'bg-secondary-fixed/40 shadow-[3px_3px_0px_#0f172a] scale-[1.01]'
                          : 'bg-surface-container-low hover:bg-surface-container shadow-[2px_2px_0px_#0f172a]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-on-surface">
                              {camp.name}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded bg-primary text-white font-mono text-[10px] font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-on-surface-variant block mt-0.5">
                            Created: {dateStr}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-base text-primary">
                          {isSelected ? 'check_circle' : 'chevron_right'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#0f172a]/15 flex items-center justify-between font-mono text-xs text-on-surface-variant">
                        <span>Datasets:</span>
                        <span className="font-bold text-on-surface bg-surface-container px-1.5 py-0.5 rounded border border-[#0f172a]/20">
                          {camp.total_datasets ?? 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t-2 border-[#0f172a] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setCampaignId(null);
              onClose();
            }}
            className="text-xs font-mono text-on-surface-variant hover:text-on-surface underline cursor-pointer"
          >
            Clear Active Campaign
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a] text-xs font-bold hover:bg-surface-container cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
