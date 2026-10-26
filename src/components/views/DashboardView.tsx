import React from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardDrive,
  Clock,
  RotateCcw,
  Play,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Database,
  Layers,
  Zap,
  Boxes,
  Server,
} from 'lucide-react';

interface Props {
  onOpenNewJob: () => void;
  onOpenRestore: () => void;
  onOpenAddServer: () => void;
  onSelectJob: (jobId: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  onOpenNewJob,
  onOpenRestore,
  onOpenAddServer,
  onSelectJob,
}) => {
  const jobs = veeamStore.getJobs();
  const repos = veeamStore.getRepositories();
  const servers = veeamStore.getServers();
  const workloads = veeamStore.getWorkloads();
  const sessions = veeamStore.getSessions();
  const restorePoints = veeamStore.getRestorePoints();
  const unprotectedWls = workloads.filter(w => !w.isProtected);
  const irSessions = veeamStore.getInstantRecoverySessions().filter(s => s.status === 'running');

  const successJobsCount = jobs.filter(j => j.status === 'success').length;
  const runningJobsCount = jobs.filter(j => j.status === 'running').length;
  const warningJobsCount = jobs.filter(j => j.status === 'warning').length;
  const failedJobsCount = jobs.filter(j => j.status === 'failed').length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto text-slate-200">
      {/* Top Banner KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {/* KPI 1: Success Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Success Rate (30d)</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">98.4%</span>
            <span className="text-xs text-emerald-400 font-medium flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> +0.6% vs SLA
            </span>
          </div>
          <span className="text-[11px] text-slate-300 mt-1">42 of 43 backup sessions successful</span>
        </div>

        {/* KPI 2: Data Protected */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Workload Data Protected</span>
            <Database size={16} className="text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">196.4 GB</span>
            <span className="text-xs text-slate-400">across 4 hosts</span>
          </div>
          <span className="text-[11px] text-slate-300 mt-1">Average dedupe ratio: 2.3x · Compression: 2.2x</span>
        </div>

        {/* KPI 3: Restore Points & Immutability */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Restore Points in Catalog</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {restorePoints.length} Points
            </span>
            <span className="text-xs text-emerald-400 font-mono">100% WORM</span>
          </div>
          <span className="text-[11px] text-slate-300 mt-1">Short-term + GFS Weekly &amp; Monthly archived</span>
        </div>

        {/* KPI 4: Instant Recovery & Sandboxes */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Instant Recovery &amp; Sandboxes</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {irSessions.length} Active
            </span>
            <span className="text-xs text-amber-300 font-medium">Ready to finalize</span>
          </div>
          <span className="text-[11px] text-slate-300 mt-1">SureBackup verified today at 04:30 UTC</span>
        </div>
      </div>

      {/* Unprotected Workloads Warning Callout */}
      {unprotectedWls.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-600/40 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-900/40 rounded text-amber-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-amber-300">
                Action Required: {unprotectedWls.length} Unprotected Docker Workloads Discovered
              </h3>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Workloads ({unprotectedWls.map(w => w.name).join(', ')}) do not belong to any active backup job and violate the 24-hour RPO target.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors shrink-0"
          >
            <span>Protect with New Job</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column (8 cols): Job Status Master List */}
        <div className="col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes size={16} className="text-emerald-400" />
                <h3 className="text-xs font-semibold text-white tracking-tight">
                  Backup Jobs &amp; Health Overview
                </h3>
              </div>
              <button
                onClick={onOpenNewJob}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
              >
                + New Job
              </button>
            </div>

            <div className="divide-y divide-slate-850">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className="p-4 hover:bg-slate-850/40 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{job.name}</span>
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                          job.status === 'running'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800/40 animate-pulse'
                            : job.status === 'success'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : job.status === 'warning'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                            : 'bg-red-950 text-red-400 border border-red-800/40'
                        }`}
                      >
                        {job.status}
                      </span>
                      {job.immutabilityDays > 0 && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-1 rounded">
                          {job.immutabilityDays}d WORM
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Schedule: {job.schedule.time}</span>
                      <span>·</span>
                      <span>Mode: {job.backupMode.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>Last Duration: {job.lastDurationSec}s</span>
                    </div>

                    {/* Status history strip (colored blocks) */}
                    <div className="flex items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-300 mr-1">Last runs:</span>
                      {job.recentRuns.map((res, i) => (
                        <span
                          key={i}
                          title={`Run ${i + 1}: ${res}`}
                          className={`w-2.5 h-2.5 rounded-sm ${
                            res === 'success'
                              ? 'bg-emerald-500'
                              : res === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        veeamStore.startJob(job.id);
                      }}
                      disabled={job.status === 'running'}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition-colors disabled:opacity-40"
                      title="Run Job Now"
                    >
                      <Play size={14} className="fill-emerald-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Recent Backup &amp; Recovery Sessions</span>
              <span className="text-slate-400 font-mono text-[11px]">{sessions.length} sessions logged</span>
            </div>
            <div className="divide-y divide-slate-850 text-xs">
              {sessions.slice(0, 3).map(sess => (
                <div key={sess.id} className="p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{sess.jobName}</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {sess.processingRateMBs} MB/s
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Started: {sess.startTime} · Bottleneck: Target ({sess.bottleneck.targetPct}%)
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold uppercase">
                    {sess.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Storage Repositories & Capacity Forecast */}
        <div className="col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive size={16} className="text-purple-400" />
                <h3 className="text-xs font-semibold text-white">Repository Capacity</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Forecast</span>
            </div>

            <div className="space-y-3">
              {repos.map(r => {
                const usedGB = r.capacityGB - r.freeGB;
                const usedPct = Math.round((usedGB / r.capacityGB) * 100);
                const daysUntilFull = r.id === 'repo-02' ? 42 : 142;

                return (
                  <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white truncate max-w-[140px]">{r.name}</span>
                      <span className="font-mono text-[11px] text-slate-400 uppercase">{r.type}</span>
                    </div>

                    {/* Capacity Bar */}
                    <div className="space-y-1">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            usedPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>{usedGB} GB Used ({usedPct}%)</span>
                        <span>{r.freeGB} GB Free</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-850 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Days Until Full:</span>
                      <span
                        className={`font-semibold font-mono ${
                          daysUntilFull < 60 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        ~{daysUntilFull} Days
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold text-white mb-2">Quick Operations</h3>
            <button
              onClick={onOpenRestore}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={14} className="text-emerald-400" />
              Launch Restore Wizard
            </button>
            <button
              onClick={onOpenAddServer}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Server size={14} className="text-amber-400" />
              Add Managed Docker Host
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
