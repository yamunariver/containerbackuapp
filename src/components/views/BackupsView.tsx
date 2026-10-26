import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { RestorePoint } from '../../types/veeam';
import {
  Database,
  RotateCcw,
  Zap,
  FolderTree,
  Lock,
  Trash2,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { GuestFileRestoreModal } from '../wizards/GuestFileRestoreModal';

interface Props {
  onOpenRestore: (rp: RestorePoint) => void;
  onOpenInstantRecovery: (rp: RestorePoint) => void;
}

export const BackupsView: React.FC<Props> = ({
  onOpenRestore,
  onOpenInstantRecovery,
}) => {
  const restorePoints = veeamStore.getRestorePoints();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRp, setSelectedRp] = useState<RestorePoint | null>(restorePoints[0] || null);
  const [guestFileModalRp, setGuestFileModalRp] = useState<RestorePoint | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredPoints = restorePoints.filter(
    rp =>
      searchTerm === '' ||
      rp.workloadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rp.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rp.timestamp.includes(searchTerm)
  );

  const handleDelete = (rp: RestorePoint) => {
    setDeleteError(null);
    const result = veeamStore.deleteRestorePoint(rp.id);
    if (!result.success) {
      setDeleteError(result.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      {/* Guest File Browser Modal */}
      {guestFileModalRp && (
        <GuestFileRestoreModal
          restorePoint={guestFileModalRp}
          onClose={() => setGuestFileModalRp(null)}
        />
      )}

      {/* Header bar */}
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-emerald-400" />
          <h2 className="text-xs font-semibold text-white tracking-tight">
            Restore Points Browser &amp; Backup Chains
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            ({restorePoints.length} points cataloged)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search workload, job, timestamp..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Delete error notification */}
      {deleteError && (
        <div className="bg-red-950/80 border-b border-red-700/60 px-6 py-2.5 text-xs text-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-red-400 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            onClick={() => setDeleteError(null)}
            className="text-[11px] text-red-400 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Master / Detail Split Pane */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* Left Column (8 cols): Table */}
        <div className="col-span-8 overflow-y-auto border-r border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <th className="py-2.5 px-4">Workload &amp; Job</th>
                <th className="py-2.5 px-3">Point-in-Time</th>
                <th className="py-2.5 px-3">Type &amp; GFS</th>
                <th className="py-2.5 px-3">Backup Size</th>
                <th className="py-2.5 px-3">WORM Immutability</th>
                <th className="py-2.5 px-4 text-right">Recovery Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredPoints.map(rp => {
                const isSelected = selectedRp?.id === rp.id;

                return (
                  <tr
                    key={rp.id}
                    onClick={() => setSelectedRp(rp)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{rp.workloadName}</span>
                      <span className="text-[11px] text-slate-400">{rp.jobName}</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-200">
                      {rp.timestamp}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded uppercase font-mono">
                          {rp.type.replace('_', ' ')}
                        </span>
                        {rp.gfsFlag && (
                          <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800/40 px-1.5 py-0.5 rounded font-mono font-bold">
                            GFS: {rp.gfsFlag}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300 tabular-nums">
                      {formatBytes(rp.sizeBytes)}
                    </td>

                    <td className="py-3 px-3">
                      {rp.immutabilityUntil ? (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                          <Lock size={12} />
                          <span>Until {rp.immutabilityUntil.substring(0, 10)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No lock</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setGuestFileModalRp(rp)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 flex items-center gap-1"
                          title="Browse volume file tree and download ZIP"
                        >
                          <FolderTree size={12} className="text-amber-400" />
                          <span>Guest Files</span>
                        </button>

                        <button
                          onClick={() => onOpenInstantRecovery(rp)}
                          className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded text-[11px] border border-amber-700/50 flex items-center gap-1"
                          title="Instant Recovery (Start container in seconds)"
                        >
                          <Zap size={12} className="text-amber-400" />
                          <span>Instant</span>
                        </button>

                        <button
                          onClick={() => onOpenRestore(rp)}
                          className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded text-[11px] border border-emerald-700/50 flex items-center gap-1"
                          title="Full Workload Restore Wizard"
                        >
                          <RotateCcw size={12} className="text-emerald-400" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => handleDelete(rp)}
                          className="p-1 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Delete restore point from disk"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column (4 cols): Selected Restore Point Details & Artifacts */}
        <div className="col-span-4 p-5 bg-slate-950/40 overflow-y-auto space-y-4">
          {selectedRp ? (
            <>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Restore Point Specification
                </span>
                <h3 className="text-sm font-semibold text-white">{selectedRp.workloadName}</h3>
                <span className="text-xs text-slate-400 block font-mono">{selectedRp.timestamp}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Repository:</span>
                  <span className="text-white font-mono">{selectedRp.repositoryId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Chain Classification:</span>
                  <span className="text-emerald-400 font-mono capitalize">
                    {selectedRp.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deduplication Ratio:</span>
                  <span className="text-white font-mono">{selectedRp.dedupeRatio}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Compression Engine:</span>
                  <span className="text-white font-mono">zstd ({selectedRp.compressionRatio}x)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Integrity Checksum:</span>
                  <span className="text-emerald-400 font-mono text-[10px] truncate max-w-[150px]">
                    {selectedRp.checksumSha256}
                  </span>
                </div>
              </div>

              {/* Artifacts Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Encapsulated Artifacts ({selectedRp.artifacts.length})
                </span>

                <div className="space-y-1.5">
                  {selectedRp.artifacts.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic p-3 border border-slate-800 rounded">
                      Synthetic volume increments merged into base extent.
                    </div>
                  ) : (
                    selectedRp.artifacts.map(art => (
                      <div
                        key={art.id}
                        className="p-2.5 bg-slate-900 border border-slate-850 rounded text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-white font-medium text-[11px] truncate max-w-[180px]">
                            {art.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatBytes(art.sizeBytes)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>SHA-256: {art.checksumSha256}</span>
                          <span>Ratio: {art.compressionRatio}x</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Launch Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setGuestFileModalRp(selectedRp)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <FolderTree size={14} className="text-amber-400" />
                  Browse &amp; Download Guest Files
                </button>

                <button
                  onClick={() => onOpenInstantRecovery(selectedRp)}
                  className="w-full py-2 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Zap size={14} className="text-amber-400" />
                  Launch Instant Recovery Session
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-slate-500 text-xs">
              Select a restore point to inspect metadata and artifacts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
