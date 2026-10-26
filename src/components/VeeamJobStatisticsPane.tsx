import React, { useState, useEffect, useRef } from 'react';
import { JobSession, SessionLogLine } from '../types/veeam';
import {
  ChevronUp,
  ChevronDown,
  Activity,
  Gauge,
  HardDrive,
  Cpu,
  Network,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Square,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface Props {
  session: JobSession | null;
  onStopJob?: (jobId: string) => void;
}

export const VeeamJobStatisticsPane: React.FC<Props> = ({ session, onStopJob }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [logFilter, setLogFilter] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [session?.logs?.length]);

  if (!session) {
    return (
      <div className="h-10 bg-slate-900 border-t border-slate-850 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-400" />
          <span>Job Statistics Pane: No active or selected job session.</span>
        </div>
        <span className="text-[11px] text-slate-300">Select any job or session to inspect telemetry.</span>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredLogs = session.logs.filter(
    (l: SessionLogLine) =>
      logFilter === '' ||
      l.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      l.phase.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <div
      className={`bg-slate-950 border-t border-slate-800 transition-all duration-200 flex flex-col ${
        isExpanded ? 'h-64' : 'h-10'
      }`}
    >
      {/* Pane Header Bar */}
      <div className="h-10 bg-slate-900/90 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white tracking-tight">
              Session Statistics:
            </span>
            <span className="text-xs text-emerald-400 font-medium">{session.jobName}</span>
            <span
              className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                session.status === 'running'
                  ? 'bg-sky-950 text-sky-400 border border-sky-800/40 animate-pulse'
                  : session.status === 'success'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : session.status === 'warning'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                  : 'bg-red-950 text-red-400 border border-red-800/40'
              }`}
            >
              {session.status}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <span className="text-xs text-slate-400">
            Phase: <strong className="text-slate-200">{session.currentWorkload || 'Idle'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {session.status === 'running' && onStopJob && (
            <button
              onClick={() => onStopJob(session.jobId)}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 rounded text-[11px] font-medium transition-colors"
            >
              <Square size={11} className="fill-red-400" />
              Stop Job
            </button>
          )}

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
            <span>Rate: <strong className="text-emerald-400">{session.processingRateMBs} MB/s</strong></span>
            <span>·</span>
            <span>Duration: <strong className="text-white">{formatDuration(session.durationSec)}</strong></span>
            <span>·</span>
            <span>Transferred: <strong className="text-white">{formatBytes(session.transferredBytes)}</strong></span>
          </div>
        </div>
      </div>

      {/* Pane Expanded Body */}
      {isExpanded && (
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Left Column: Progress & Bottleneck Analyzer */}
          <div className="col-span-4 p-4 border-r border-slate-850 flex flex-col justify-between overflow-y-auto space-y-3">
            <div>
              {/* Progress bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Progress</span>
                  <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                    {session.progressPct}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${session.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Veeam Bottleneck Analysis */}
              <div className="space-y-2 bg-slate-900/60 border border-slate-850 rounded p-3 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">Veeam Bottleneck Analysis</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Target ({session.bottleneck.targetPct}%)
                  </span>
                </div>

                <div className="space-y-1.5 text-[10px] font-mono">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>Source Docker Host</span>
                      <span>{session.bottleneck.sourcePct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded">
                      <div
                        className="h-full bg-sky-500 rounded"
                        style={{ width: `${session.bottleneck.sourcePct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>Backup Proxy (Worker)</span>
                      <span>{session.bottleneck.proxyPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded">
                      <div
                        className="h-full bg-amber-500 rounded"
                        style={{ width: `${session.bottleneck.proxyPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>Network / SSH Stream</span>
                      <span>{session.bottleneck.networkPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded">
                      <div
                        className="h-full bg-indigo-500 rounded"
                        style={{ width: `${session.bottleneck.networkPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span>Target Repository (Storage)</span>
                      <span className="text-emerald-400 font-bold">{session.bottleneck.targetPct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded">
                      <div
                        className="h-full bg-emerald-500 rounded"
                        style={{ width: `${session.bottleneck.targetPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dedupe & Compression Ratios */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900 border border-slate-850 rounded">
                <span className="text-slate-400 text-[10px] block">Deduplication</span>
                <span className="text-emerald-400 font-mono font-semibold tabular-nums">
                  {session.dedupeRatio}x
                </span>
              </div>
              <div className="p-2 bg-slate-900 border border-slate-850 rounded">
                <span className="text-slate-400 text-[10px] block">Compression</span>
                <span className="text-emerald-400 font-mono font-semibold tabular-nums">
                  {session.compressionRatio}x
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Session Log Stream */}
          <div className="col-span-8 flex flex-col overflow-hidden bg-slate-950">
            {/* Log filter bar */}
            <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">Live Session Event Stream</span>
              <div className="relative w-48">
                <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter log lines..."
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded pl-7 pr-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Terminal log container */}
            <div
              ref={logContainerRef}
              className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1.5 select-text"
            >
              {filteredLogs.map((log: SessionLogLine) => {
                let badgeClass = 'text-slate-400';
                if (log.level === 'success') badgeClass = 'text-emerald-400';
                if (log.level === 'warn') badgeClass = 'text-amber-400';
                if (log.level === 'error') badgeClass = 'text-red-400';

                return (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-300 shrink-0 font-medium tabular-nums">[{log.timestamp}]</span>
                    <span className="text-[10px] text-slate-300 uppercase px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded shrink-0">
                      {log.phase}
                    </span>
                    <span className={`break-words ${badgeClass}`}>{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
