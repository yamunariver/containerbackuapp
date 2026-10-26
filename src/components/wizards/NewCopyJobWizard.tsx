import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  Copy,
  HardDrive,
  ArrowRight,
  ArrowLeft,
  X,
  Gauge,
  Calendar,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const NewCopyJobWizard: React.FC<Props> = ({ onClose, onSuccess }) => {
  const jobs = veeamStore.getJobs();
  const repos = veeamStore.getRepositories();

  const [name, setName] = useState('');
  const [sourceJobId, setSourceJobId] = useState(jobs[0]?.id || '');
  const [targetRepoId, setTargetRepoId] = useState(repos[1]?.id || repos[0]?.id || '');
  const [mode, setMode] = useState<'immediate' | 'periodic'>('immediate');
  const [bandwidthLimitMBs, setBandwidthLimitMBs] = useState(100);
  const [retentionPoints, setRetentionPoints] = useState(30);
  const [gfsEnabled, setGfsEnabled] = useState(true);

  const selectedSourceJob = jobs.find(j => j.id === sourceJobId);

  const handleFinish = () => {
    veeamStore.addCopyJob({
      name: name || `3-2-1 Copy: ${selectedSourceJob?.name || 'Job'}`,
      sourceJobId,
      sourceRepoId: selectedSourceJob?.repositoryId || repos[0]?.id || 'repo-01',
      targetRepoId,
      mode,
      bandwidthLimitMBs,
      retentionPoints,
      gfsEnabled,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden text-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-950 border border-sky-600/40 rounded text-sky-400">
              <Copy size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                New Backup Copy Job Wizard (3-2-1 Rule)
              </h2>
              <span className="text-xs text-slate-400">
                Copies restore points to a secondary storage vault or cloud repository.
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-xs space-y-4">
          <div className="p-3 bg-sky-950/20 border border-sky-600/30 rounded text-sky-200/90 leading-relaxed text-[11px]">
            <strong>The 3-2-1 Backup Rule:</strong> Maintain at least 3 copies of data, on 2 different media types, with 1 copy offsite/immutable. A Backup Copy Job operates independently from the primary backup job, reading from the primary repository rather than stressing production Docker hosts.
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Backup Copy Job Name</label>
            <input
              type="text"
              placeholder="e.g. 3-2-1 Copy: Nextcloud to NFS Archive"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Source Backup Job</label>
              <select
                value={sourceJobId}
                onChange={e => setSourceJobId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Secondary Repository</label>
              <select
                value={targetRepoId}
                onChange={e => setTargetRepoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {repos.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Copy Sync Mode</label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value as 'immediate' | 'periodic')}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="immediate">Immediate Copy (Sync right after backup finishes)</option>
                <option value="periodic">Periodic Copy (Scheduled transfer window)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Bandwidth Throttle (MB/s)</label>
              <input
                type="number"
                value={bandwidthLimitMBs}
                onChange={e => setBandwidthLimitMBs(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Secondary Retention Points</label>
              <input
                type="number"
                value={retentionPoints}
                onChange={e => setRetentionPoints(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gfsEnabled}
                  onChange={e => setGfsEnabled(e.target.checked)}
                  className="accent-emerald-500 rounded"
                />
                <span className="text-slate-200 font-medium">
                  Enforce GFS Retention on Copy Target
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
          >
            Create Backup Copy Job
          </button>
        </div>
      </div>
    </div>
  );
};
