import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  ShieldCheck,
  Server,
  ArrowRight,
  X,
  Play,
  Network,
  Activity,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const SureBackupWizard: React.FC<Props> = ({ onClose, onSuccess }) => {
  const jobs = veeamStore.getJobs();
  const servers = veeamStore.getServers();

  const [name, setName] = useState('');
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [targetServerId, setTargetServerId] = useState(servers[0]?.id || '');
  const [isolatedNetwork, setIsolatedNetwork] = useState('surebackup_sandbox_iso');
  const [testScript, setTestScript] = useState('curl -f http://localhost:8080/healthz && psql -U postgres -c "SELECT 1"');
  const [port, setPort] = useState(8080);
  const [endpoint, setEndpoint] = useState('/healthz');

  const handleCreate = () => {
    // Add SureBackup job or execute verification
    veeamStore.addAuditLog(
      'SUREBACKUP_JOB_CREATE',
      name || 'SureBackup Verification Job',
      `Configured automated verification sandbox on ${targetServerId}`
    );
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden text-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded text-emerald-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                New SureBackup Recovery Verification Job
              </h2>
              <span className="text-xs text-slate-400">
                Automated test-restore in an isolated network sandbox to prove 100% recoverability.
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 text-xs space-y-4">
          <div className="p-3 bg-emerald-950/20 border border-emerald-600/30 rounded text-emerald-200/90 leading-relaxed text-[11px]">
            <strong>SureBackup Technology:</strong> Automatically restores the latest restore point into a temporary, isolated Docker bridge network. It boots the containers, verifies TCP port responsiveness, checks HTTP status codes, executes database integrity queries, records an SLA verification proof, and cleanly tears down all resources.
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">SureBackup Job Name</label>
            <input
              type="text"
              placeholder="e.g. Daily Verification: Production Nextcloud & DBs"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Linked Backup Job to Verify</label>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
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
              <label className="text-slate-300 font-medium block mb-1">Verification Host (Sandbox)</label>
              <select
                value={targetServerId}
                onChange={e => setTargetServerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {servers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Isolated Network Name</label>
              <input
                type="text"
                value={isolatedNetwork}
                onChange={e => setIsolatedNetwork(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">HTTP Probe Endpoint</label>
              <input
                type="text"
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Custom Verification Script / Query</label>
            <textarea
              rows={2}
              value={testScript}
              onChange={e => setTestScript(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono text-[11px]"
            />
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-slate-300">
            <span>Automatic Sandbox Teardown:</span>
            <span className="text-emerald-400 font-medium">Enabled (Immediate cleanup upon completion)</span>
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
            onClick={handleCreate}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
          >
            Create SureBackup Job
          </button>
        </div>
      </div>
    </div>
  );
};
