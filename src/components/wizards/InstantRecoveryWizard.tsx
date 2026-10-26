import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { RestorePoint } from '../../types/veeam';
import {
  Zap,
  Server,
  ArrowRight,
  X,
  Play,
  CheckCircle,
  Radio,
  Clock,
  HardDrive,
} from 'lucide-react';

interface Props {
  initialRestorePoint?: RestorePoint | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const InstantRecoveryWizard: React.FC<Props> = ({
  initialRestorePoint,
  onClose,
  onSuccess,
}) => {
  const restorePoints = veeamStore.getRestorePoints();
  const servers = veeamStore.getServers();

  const [selectedRpId, setSelectedRpId] = useState(
    initialRestorePoint?.id || restorePoints[0]?.id || ''
  );
  const [targetServerId, setTargetServerId] = useState(servers[0]?.id || '');
  const [tempContainerName, setTempContainerName] = useState('');
  const [publishedPort, setPublishedPort] = useState(9095);
  const [isLaunching, setIsLaunching] = useState(false);

  const selectedRp = restorePoints.find(r => r.id === selectedRpId);

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      const name = tempContainerName || `instant-${selectedRp?.workloadName || 'container'}`;
      veeamStore.startInstantRecovery(selectedRpId, targetServerId, publishedPort, name);
      setIsLaunching(false);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden text-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950 border border-amber-600/40 rounded text-amber-400">
              <Zap size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Veeam Instant Recovery for Docker
              </h2>
              <span className="text-xs text-slate-400">
                Immediately start a container from backup with minimal delay without waiting for full data transfer.
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-xs space-y-4">
          <div className="p-3 bg-amber-950/20 border border-amber-600/30 rounded text-amber-200/90 leading-relaxed text-[11px]">
            <strong>Instant Recovery Engine:</strong> Mounts backup volume snapshots as temporary copy-on-write overlay volumes directly on the target host. The container starts in seconds. While running, you can verify data, test changes, and later choose to <strong>Finalize</strong> (promote to permanent) or <strong>Discard</strong>.
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Select Source Restore Point</label>
            <select
              value={selectedRpId}
              onChange={e => setSelectedRpId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            >
              {restorePoints.map(rp => (
                <option key={rp.id} value={rp.id}>
                  {rp.workloadName} — {rp.timestamp} ({rp.type.toUpperCase()} · {Math.round(rp.sizeBytes / 1e9 * 10) / 10} GB)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Target Linux Docker Host</label>
              <select
                value={targetServerId}
                onChange={e => setTargetServerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {servers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.host})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Isolated Published Port</label>
              <input
                type="number"
                value={publishedPort}
                onChange={e => setPublishedPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-400 text-[10px] mt-0.5 block">Prevents conflict with production ports.</span>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Temporary Container Name</label>
            <input
              type="text"
              placeholder={`instant-recovery-${selectedRp?.workloadName || 'test'}`}
              value={tempContainerName}
              onChange={e => setTempContainerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1 text-slate-400 text-[11px]">
            <div className="flex justify-between">
              <span>Estimated Start Latency:</span>
              <span className="text-emerald-400 font-mono">&lt; 3 seconds</span>
            </div>
            <div className="flex justify-between">
              <span>Write Cache Mode:</span>
              <span className="text-slate-300 font-mono">Copy-on-Write Ephemeral Scratch</span>
            </div>
            <div className="flex justify-between">
              <span>Security Isolation:</span>
              <span className="text-slate-300 font-mono">Dedicated bridge network</span>
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
            onClick={handleLaunch}
            disabled={isLaunching}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors shadow"
          >
            <Play size={13} />
            {isLaunching ? 'Mounting & Launching...' : 'Start Instant Recovery'}
          </button>
        </div>
      </div>
    </div>
  );
};
