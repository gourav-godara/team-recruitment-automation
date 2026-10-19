import { useState } from 'react';
import { mockStressPresets } from '../../data/mockStability';

export default function PerturbationController({
  weights,
  onWeightChange,
  activePreset,
  onSelectPreset,
  onRunSimulation,
  isSimulating,
}) {
  const total = weights.tech + weights.github + weights.track + weights.velocity;
  const isBalanced = total === 100;

  return (
    <div className="bg-surface-container-lowest rounded-xl border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] overflow-hidden">
      {/* Header Strip */}
      <div className="bg-surface-container-high px-space-md py-3 flex items-center justify-between border-b-2 border-[#0f172a]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl font-bold">tune</span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
            Perturbation Controller
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono font-bold text-label-sm text-label-sm border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]">
          MC-10K
        </span>
      </div>

      <div className="p-space-md flex flex-col gap-space-lg">
        {/* Presets Section */}
        <div>
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider font-extrabold text-on-surface">
              Stress Presets
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
              Quick Switch
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(mockStressPresets).map((preset) => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className={`px-3 py-2 text-left rounded-lg font-label-md text-label-md font-bold transition-all border-2 border-[#0f172a] cursor-pointer ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-[3px_3px_0px_#0f172a]'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container shadow-[1px_1px_0px_#0f172a]'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Sliders */}
        <div className="flex flex-col gap-space-md bg-surface-container-low p-space-md rounded-xl border-2 border-[#0f172a] shadow-[2px_2px_0px_#0f172a]">
          {/* Slider 1: Tech */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary-container inline-block border border-[#0f172a]"></span>
                <label className="font-label-md text-label-md font-extrabold text-on-surface" htmlFor="weight-tech">
                  Technical Depth
                </label>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Base 35%</span>
                <span className="font-label-md text-label-md font-bold px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]" id="val-tech">
                  {weights.tech}%
                </span>
              </div>
            </div>
            <input
              type="range"
              id="weight-tech"
              min="20"
              max="50"
              value={weights.tech}
              onChange={(e) => onWeightChange('tech', parseInt(e.target.value, 10))}
              className="w-full accent-[#2563eb] cursor-pointer h-2.5 bg-surface-container-highest rounded-lg border border-[#0f172a]"
            />
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
              <span>Min: 20% (-15%)</span>
              <span>Max: 50% (+15%)</span>
            </div>
          </div>

          {/* Slider 2: GitHub */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block border border-[#0f172a]"></span>
                <label className="font-label-md text-label-md font-extrabold text-on-surface" htmlFor="weight-github">
                  GitHub Repo Quality
                </label>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Base 25%</span>
                <span className="font-label-md text-label-md font-bold px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]" id="val-github">
                  {weights.github}%
                </span>
              </div>
            </div>
            <input
              type="range"
              id="weight-github"
              min="10"
              max="40"
              value={weights.github}
              onChange={(e) => onWeightChange('github', parseInt(e.target.value, 10))}
              className="w-full accent-[#10b981] cursor-pointer h-2.5 bg-surface-container-highest rounded-lg border border-[#0f172a]"
            />
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
              <span>Min: 10% (-15%)</span>
              <span>Max: 40% (+15%)</span>
            </div>
          </div>

          {/* Slider 3: Track */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-secondary-fixed-dim inline-block border border-[#0f172a]"></span>
                <label className="font-label-md text-label-md font-extrabold text-on-surface" htmlFor="weight-track">
                  Track Alignment
                </label>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Base 20%</span>
                <span className="font-label-md text-label-md font-bold px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]" id="val-track">
                  {weights.track}%
                </span>
              </div>
            </div>
            <input
              type="range"
              id="weight-track"
              min="10"
              max="30"
              value={weights.track}
              onChange={(e) => onWeightChange('track', parseInt(e.target.value, 10))}
              className="w-full accent-[#6d5e00] cursor-pointer h-2.5 bg-surface-container-highest rounded-lg border border-[#0f172a]"
            />
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
              <span>Min: 10% (-10%)</span>
              <span>Max: 30% (+10%)</span>
            </div>
          </div>

          {/* Slider 4: Velocity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-tertiary-container inline-block border border-[#0f172a]"></span>
                <label className="font-label-md text-label-md font-extrabold text-on-surface" htmlFor="weight-velocity">
                  Team Velocity
                </label>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Base 20%</span>
                <span className="font-label-md text-label-md font-bold px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface border border-[#0f172a] shadow-[1px_1px_0px_#0f172a]" id="val-velocity">
                  {weights.velocity}%
                </span>
              </div>
            </div>
            <input
              type="range"
              id="weight-velocity"
              min="10"
              max="30"
              value={weights.velocity}
              onChange={(e) => onWeightChange('velocity', parseInt(e.target.value, 10))}
              className="w-full accent-[#ad0033] cursor-pointer h-2.5 bg-surface-container-highest rounded-lg border border-[#0f172a]"
            />
            <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant font-mono">
              <span>Min: 10% (-10%)</span>
              <span>Max: 30% (+10%)</span>
            </div>
          </div>
        </div>

        {/* Normalized Bar Preview */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between font-label-sm text-label-sm font-bold uppercase text-on-surface-variant">
            <span>Normalized Weight Allocation</span>
            <span
              className={`font-mono font-bold ${
                isBalanced ? 'text-primary' : 'text-tertiary'
              }`}
            >
              {isBalanced ? '100.0% (BALANCED)' : `${total}% (RAW TOTAL)`}
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-surface-container border-2 border-[#0f172a] shadow-inner">
            <div
              className="h-full bg-primary-container transition-all"
              style={{ width: `${(weights.tech / (total || 1)) * 100}%` }}
              title={`Tech: ${weights.tech}%`}
            ></div>
            <div
              className="h-full bg-[#10b981] transition-all"
              style={{ width: `${(weights.github / (total || 1)) * 100}%` }}
              title={`GitHub: ${weights.github}%`}
            ></div>
            <div
              className="h-full bg-secondary-fixed-dim transition-all"
              style={{ width: `${(weights.track / (total || 1)) * 100}%` }}
              title={`Track: ${weights.track}%`}
            ></div>
            <div
              className="h-full bg-tertiary-container transition-all"
              style={{ width: `${(weights.velocity / (total || 1)) * 100}%` }}
              title={`Velocity: ${weights.velocity}%`}
            ></div>
          </div>
        </div>

        {/* Tactile Big Action Button */}
        <button
          type="button"
          id="run-mc-btn"
          disabled={isSimulating}
          onClick={onRunSimulation}
          className="w-full py-3.5 px-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-headline-sm text-headline-sm font-black flex items-center justify-center gap-2 border-2 border-[#0f172a] shadow-[4px_4px_0px_#0f172a] hover:brightness-105 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0f172a] transition-all cursor-pointer disabled:opacity-75"
        >
          {isSimulating ? (
            <>
              <span className="material-symbols-outlined text-2xl animate-spin font-black">sync</span>
              <span>Crunching 10,000 Iterations...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-2xl font-black">bolt</span>
              <span>Run 10,000 Perturbation Cycles</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
