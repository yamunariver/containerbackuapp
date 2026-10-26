import React from 'react';
import { veeamStore } from '../../services/veeamStore';
import { JobSession } from '../../types/veeam';
import {
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Search,
} from 'lucide-react';

interface Props {
  onSelectSession: (session: JobSession) => void;
  selectedSessionId?: string | null;
}

export const SessionsView: React.FC<Props> = ({
  onSelectSession,
  selectedSessionId,
}) => {
  const sessions = veeamStore.getSessions();

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-emerald-400" />
          <h2 className="text-xs font-semibold text-white tracking-tight">
            Last 24 Hours Session History &amp; Live Logs
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            ({sessions.length} sessions recorded)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <th className="py-2.5 px-4">Session &amp; Job</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Start Time</th>
              <th className="py-2.5 px-3">Duration</th>
              <th className="py-2.5 px-3">Processing Rate</th>
              <th className="py-2.5 px-3">Transferred</th>
              <th className="py-2.5 px-4">Bottleneck Indicator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {sessions.map(sess => {
              const isSelected = selectedSessionId === sess.id;

              return (
                <tr
                  key={sess.id}
                  onClick={() => onSelectSession(sess)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-800/80 text-white' : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{sess.jobName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {sess.id}</span>
                  </td>

                  <td className="py-3 px-3 uppercase font-mono text-[11px] text-slate-300">
                    {sess.type}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold inline-block ${
                        sess.status === 'running'
                          ? 'bg-sky-950 text-sky-400 border border-sky-800/40 animate-pulse'
                          : sess.status === 'success'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : sess.status === 'warning'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          : 'bg-red-950 text-red-400 border border-red-800/40'
                      }`}
                    >
                      {sess.status}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-200">
                    {sess.startTime}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                    {formatDuration(sess.durationSec)}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-emerald-400">
                    {sess.processingRateMBs > 0 ? `${sess.processingRateMBs} MB/s` : '-'}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                    {formatBytes(sess.transferredBytes)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-slate-400">
                        Target ({sess.bottleneck.targetPct}%)
                      </span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded">
                        <div
                          className="h-full bg-emerald-500 rounded"
                          style={{ width: `${sess.bottleneck.targetPct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
