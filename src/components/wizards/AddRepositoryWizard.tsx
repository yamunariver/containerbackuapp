import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { RepoType } from '../../types/veeam';
import {
  HardDrive,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
  Lock,
  Sliders,
  FolderTree,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddRepositoryWizard: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<RepoType>('local');
  const [path, setPath] = useState('/mnt/backup-storage/repo-02');
  const [capacityGB, setCapacityGB] = useState(8000);
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(6);
  const [rateLimitMBs, setRateLimitMBs] = useState(0);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [immutabilityDays, setImmutabilityDays] = useState(14);
  const [warningThresholdPct, setWarningThresholdPct] = useState(85);

  const handleFinish = () => {
    veeamStore.addRepository({
      name: name || 'Backup Repository',
      type,
      path,
      capacityGB,
      maxConcurrentTasks,
      rateLimitMBs,
      encryptionEnabled,
      immutabilityDays,
      warningThresholdPct,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden text-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded text-emerald-400">
              <HardDrive size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Add Backup Repository Wizard
              </h2>
              <span className="text-xs text-slate-400">
                Step {step} of 3: {step === 1 ? 'Repository Type & Location' : step === 2 ? 'Capacity, Limits & Immutability' : 'Summary'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="grid grid-cols-3 bg-slate-950/60 border-b border-slate-800 text-[11px] font-medium text-slate-400">
          <div className={`py-2 text-center border-b-2 ${step === 1 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            1. Storage Target
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 2 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            2. Limits & Immutability
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 3 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            3. Summary
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-xs space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Repository Name</label>
                <input
                  type="text"
                  placeholder="e.g. NVMe High-Speed Primary Vault"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Storage Architecture</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'local', title: 'Direct Attached / Local NVMe', desc: 'Direct fast mount on backup proxy' },
                    { id: 'nfs', title: 'Network File System (NFSv4)', desc: 'Enterprise NAS share over network' },
                    { id: 'smb', title: 'SMB / CIFS Share', desc: 'Windows / Samba network directory' },
                    { id: 's3', title: 'S3 / MinIO Object Storage', desc: 'S3 API with Object Lock support' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as RepoType)}
                      className={`p-3 text-left rounded border transition-colors ${
                        type === item.id
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-semibold block text-slate-100">{item.title}</span>
                      <span className="text-[11px] block mt-0.5">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Path / URI / Mount Target</label>
                <input
                  type="text"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Total Usable Capacity (GB)</label>
                  <input
                    type="number"
                    value={capacityGB}
                    onChange={e => setCapacityGB(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Max Concurrent Task Slots</label>
                  <input
                    type="number"
                    value={maxConcurrentTasks}
                    onChange={e => setMaxConcurrentTasks(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                  />
                  <span className="text-slate-400 text-[10px] mt-0.5 block">Queues additional jobs when slots are saturated.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Write Rate Limit (MB/s)</label>
                  <input
                    type="number"
                    value={rateLimitMBs}
                    onChange={e => setRateLimitMBs(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                  />
                  <span className="text-slate-400 text-[10px] mt-0.5 block">0 = Unlimited bandwidth throughput</span>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Low Space Alert Warning Threshold</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={warningThresholdPct}
                      onChange={e => setWarningThresholdPct(Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                    />
                    <span className="text-slate-400">% utilization</span>
                  </div>
                </div>
              </div>

              {/* Hardened Linux Repository / Immutability */}
              <div className="p-3 bg-slate-950 border border-emerald-600/30 rounded space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <Lock size={15} />
                  <span>Hardened Repository Immutability (WORM)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Protect restore points from ransomware deletion, malicious insiders, or operator error via Linux <code>chattr +i</code> or S3 Object Lock.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-slate-300 text-[11px]">Enforce Immutability Duration:</label>
                  <input
                    type="number"
                    value={immutabilityDays}
                    onChange={e => setImmutabilityDays(Number(e.target.value))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
                  />
                  <span className="text-slate-400 text-xs">Days (Non-deletable)</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-200">Review Repository Configuration</h3>
              <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Repository Name</span>
                    <span className="text-white font-medium">{name || 'Backup Repository'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Type</span>
                    <span className="text-white font-mono uppercase">{type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mount / Path</span>
                    <span className="text-white font-mono">{path}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Provisioned Capacity</span>
                    <span className="text-white font-mono">{capacityGB} GB</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Concurrent Slots</span>
                    <span className="text-white font-mono">{maxConcurrentTasks} slots</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Immutability Lock</span>
                    <span className="text-emerald-400 font-medium">{immutabilityDays} Days (WORM)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[11px]">
                Upon creation, the controller will automatically scan and verify catalog structure, creating a self-describing <code>veeam_catalog.db</code> index file.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-600 transition-colors disabled:opacity-40"
          >
            <ArrowLeft size={13} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs font-medium border border-slate-700 transition-colors"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !name}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-40"
              >
                Next
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
              >
                Finish & Add Repository
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
