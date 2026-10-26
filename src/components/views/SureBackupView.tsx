import React from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  ShieldCheck,
  Play,
  CheckCircle2,
  AlertTriangle,
  Network,
  Terminal,
  Activity,
  Plus,
} from 'lucide-react';

interface Props {
  onOpenSureBackup: () => void;
}

export const SureBackupView: React.FC<Props> = ({ onOpenSureBackup }) => {
  const sbJobs = veeamStore.getSureBackupJobs();
  const servers = veeamStore.getServers();

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <h2 className="text-xs font-semibold text-white tracking-tight">
            SureBackup Recovery Verification &amp; Sandboxes
          </h2>
        </div>

        <button
          onClick={onOpenSureBackup}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
        >
          <Plus size={13} />
          <span>New SureBackup Job</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="p-4 bg-emerald-950/20 border border-emerald-600/30 rounded-lg space-y-2">
          <h3 className="text-xs font-semibold text-emerald-300 flex items-center gap-2">
            <ShieldCheck size={16} /> Automated Recovery Verification Protocol (Veeam SureBackup)
          </h3>
          <p className="text-[11px] text-emerald-200/80 leading-relaxed">
            SureBackup jobs prove mathematically and empirically that your Docker backups are restorable before disaster strikes. When executed, Veeam spins up the workload in an isolated Docker bridge network, runs port probes, HTTP status checks and database integrity queries, logs compliance, and immediately dismantles the test sandbox.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {sbJobs.map(job => {
            const srv = servers.find(s => s.id === job.targetServerId);

            return (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-white">{job.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Sandbox Host: {srv?.name || job.targetServerId}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                      job.status === 'running'
                        ? 'bg-sky-950 text-sky-400 border border-sky-800/40 animate-pulse'
                        : job.lastResult === 'passed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    }`}
                  >
                    {job.status === 'running' ? 'Testing...' : job.lastResult || 'Idle'}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded p-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Isolated Network:</span>
                    <span className="text-sky-400 font-mono text-[11px]">{job.isolatedNetworkName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Health Check Probe:</span>
                    <span className="text-white font-mono text-[11px]">
                      Port {job.healthCheckPort} · GET {job.healthCheckEndpoint}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Auto-Teardown:</span>
                    <span className="text-emerald-400 font-medium">Enabled (Zero residue)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Verified:</span>
                    <span className="text-white font-mono">{job.lastRunAt || 'Never'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Verification Script</span>
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded font-mono text-[11px] text-slate-300 truncate">
                    {job.testScript}
                  </div>
                </div>

                <button
                  onClick={() => veeamStore.runSureBackup(job.id)}
                  disabled={job.status === 'running'}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Play size={13} className="fill-white" />
                  <span>{job.status === 'running' ? 'Running Recovery Tests...' : 'Run SureBackup Verification Now'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
