import React from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  Zap,
  RotateCcw,
  Play,
  Square,
  CheckCircle2,
  Trash2,
  Server,
  Clock,
  HardDrive,
  Activity,
  Plus,
} from 'lucide-react';

interface Props {
  onOpenInstantRecovery: () => void;
}

export const InstantRecoveryView: React.FC<Props> = ({ onOpenInstantRecovery }) => {
  const sessions = veeamStore.getInstantRecoverySessions();
  const activeSessions = sessions.filter(s => s.status === 'running');

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          <h2 className="text-xs font-semibold text-white tracking-tight">
            Veeam Instant Recovery Sessions
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            ({activeSessions.length} active running)
          </span>
        </div>

        <button
          onClick={onOpenInstantRecovery}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
        >
          <Plus size={13} />
          <span>Launch Instant Recovery</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="p-4 bg-amber-950/20 border border-amber-600/30 rounded-lg space-y-2">
          <h3 className="text-xs font-semibold text-amber-300 flex items-center gap-2">
            <Zap size={16} /> Instant Recovery Lifecycle
          </h3>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Instant Recovery spins up Docker containers directly from backup repositories within seconds without waiting for multi-gigabyte volume transfers. Once you are satisfied with operation, click <strong>Finalize</strong> to promote the container to permanent production storage, or <strong>Discard</strong> to dismantle the temporary container and free copy-on-write scratch space.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-slate-800 rounded-lg space-y-3">
            <Zap size={32} className="text-slate-600 mx-auto" />
            <h4 className="text-xs font-semibold text-slate-400">No Instant Recovery Sessions Running</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              You can instantly run any container directly from any restore point in the catalog for immediate disaster recovery or test access.
            </p>
            <button
              onClick={onOpenInstantRecovery}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
            >
              Start Instant Recovery
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(sess => (
              <div
                key={sess.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{sess.tempContainerName}</h4>
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                            sess.status === 'running'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700/50 animate-pulse'
                              : sess.status === 'finalized'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {sess.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        Workload: {sess.workloadName} · Target Host: {sess.targetServerName}:{sess.publishedPort}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-300 pt-1">
                    <span>Started: {sess.startedAt}</span>
                    <span>·</span>
                    <span>Memory: {sess.memoryUsageMB} MB</span>
                    <span>·</span>
                    <span>CPU: {sess.cpuPct}%</span>
                    <span>·</span>
                    <span className="text-emerald-400">Status: Serving Traffic</span>
                  </div>
                </div>

                {sess.status === 'running' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => veeamStore.finalizeInstantRecovery(sess.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 size={13} />
                      <span>Finalize (Promote to Permanent)</span>
                    </button>
                    <button
                      onClick={() => veeamStore.discardInstantRecovery(sess.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 rounded text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Stop &amp; Discard</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
