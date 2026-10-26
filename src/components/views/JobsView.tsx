import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { BackupJob, BackupCopyJob } from '../../types/veeam';
import {
  Play,
  Square,
  RotateCw,
  Plus,
  Boxes,
  Copy,
  Clock,
  HardDrive,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PauseCircle,
  Calendar,
} from 'lucide-react';

interface Props {
  onOpenNewJob: () => void;
  onOpenNewCopyJob: () => void;
  onSelectJob: (jobId: string) => void;
  selectedJobId?: string | null;
}

export const JobsView: React.FC<Props> = ({
  onOpenNewJob,
  onOpenNewCopyJob,
  onSelectJob,
  selectedJobId,
}) => {
  const jobs = veeamStore.getJobs();
  const copyJobs = veeamStore.getCopyJobs();
  const repositories = veeamStore.getRepositories();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'backup' | 'copy'>('backup');

  const filteredJobs = jobs.filter(
    j =>
      searchTerm === '' ||
      j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCopyJobs = copyJobs.filter(
    c => searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      {/* View Header & Search */}
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'backup'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Backup Jobs ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('copy')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'copy'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Backup Copy Jobs ({copyJobs.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {activeTab === 'backup' ? (
            <button
              onClick={onOpenNewJob}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
            >
              <Plus size={13} />
              <span>Create Backup Job</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewCopyJob}
              className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
            >
              <Plus size={13} />
              <span>Create Copy Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'backup' ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <th className="py-2.5 px-4">Job Name &amp; Description</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Mode &amp; GFS</th>
                <th className="py-2.5 px-3">Next Run</th>
                <th className="py-2.5 px-3">Last Duration</th>
                <th className="py-2.5 px-3">Transferred</th>
                <th className="py-2.5 px-3">Run History</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredJobs.map(job => {
                const isSelected = selectedJobId === job.id;
                const repo = repositories.find(r => r.id === job.repositoryId);

                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-800/80 text-white'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Boxes size={15} className="text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-white block">{job.name}</span>
                          <span className="text-[11px] text-slate-400 truncate max-w-sm block">
                            {job.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold inline-block ${
                          job.status === 'running'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800/40 animate-pulse'
                            : job.status === 'success'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : job.status === 'warning'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : job.status === 'disabled'
                            ? 'bg-slate-900 text-slate-500 border border-slate-800'
                            : 'bg-red-950 text-red-400 border border-red-800/40'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-200 capitalize block">
                        {job.backupMode.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Keep {job.retentionPoints} RP · GFS ({job.gfsPolicy.weeklyCount}W/{job.gfsPolicy.monthlyCount}M)
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                      {job.nextRunAt || 'Manual only'}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300 tabular-nums">
                      {job.lastDurationSec > 0 ? `${job.lastDurationSec}s` : '-'}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300 tabular-nums">
                      {formatBytes(job.lastTransferredBytes)}
                    </td>

                    {/* Colored status strip */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {job.recentRuns.map((res, i) => (
                          <span
                            key={i}
                            title={`Run: ${res}`}
                            className={`w-2.5 h-3.5 rounded-sm ${
                              res === 'success'
                                ? 'bg-emerald-500'
                                : res === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {job.status === 'running' ? (
                          <button
                            onClick={() => veeamStore.stopJob(job.id)}
                            className="p-1 bg-red-950/80 hover:bg-red-900 text-red-400 rounded border border-red-800/50"
                            title="Stop Running Job"
                          >
                            <Square size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => veeamStore.startJob(job.id)}
                            className="p-1 bg-slate-800 hover:bg-emerald-950 text-emerald-400 rounded border border-slate-700"
                            title="Start Backup Job"
                          >
                            <Play size={13} className="fill-emerald-400" />
                          </button>
                        )}
                        <button
                          onClick={() => veeamStore.toggleJobDisabled(job.id)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                          title={job.status === 'disabled' ? 'Enable Schedule' : 'Disable Schedule'}
                        >
                          <PauseCircle size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Copy Jobs Table */
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                <th className="py-2.5 px-4">Backup Copy Job</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Source &amp; Target Repos</th>
                <th className="py-2.5 px-3">Throttle Limit</th>
                <th className="py-2.5 px-3">Copy Lag</th>
                <th className="py-2.5 px-3">Last Sync</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredCopyJobs.map(cJob => (
                <tr key={cJob.id} className="hover:bg-slate-900/60 text-slate-300">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Copy size={15} className="text-sky-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white block">{cJob.name}</span>
                        <span className="text-[11px] text-slate-400">
                          Enforcing 3-2-1 secondary retention ({cJob.retentionPoints} RP)
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 uppercase font-mono text-[11px] text-slate-200">
                    {cJob.mode}
                  </td>
                  <td className="py-3 px-3 text-[11px] font-mono text-slate-300">
                    {cJob.sourceRepoId} → {cJob.targetRepoId}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {cJob.bandwidthLimitMBs} MB/s
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span className={cJob.copyLagMinutes > 30 ? 'text-amber-400' : 'text-emerald-400'}>
                      {cJob.copyLagMinutes} min lag
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                    {cJob.lastRunAt || 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => veeamStore.runCopyJob(cJob.id)}
                      disabled={cJob.status === 'running'}
                      className="px-2.5 py-1 bg-sky-950 border border-sky-800/40 text-sky-400 hover:bg-sky-900 rounded text-[11px] font-medium transition-colors disabled:opacity-40"
                    >
                      {cJob.status === 'running' ? 'Syncing...' : 'Sync Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
