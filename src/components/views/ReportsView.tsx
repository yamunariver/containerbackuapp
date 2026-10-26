import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  TrendingUp,
  ShieldAlert,
  Bell,
  Check,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const workloads = veeamStore.getWorkloads();
  const repos = veeamStore.getRepositories();
  const alarms = veeamStore.getAlarms();
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const protectedCount = workloads.filter(w => w.isProtected).length;
  const totalCount = workloads.length;
  const slaCompliancePct = Math.round((protectedCount / totalCount) * 100);

  const handleExportCsv = () => {
    const csvContent =
      'Workload,Host,Type,ProtectionStatus,SizeGB,DBEngine\n' +
      workloads
        .map(
          w =>
            `${w.name},${w.serverName},${w.type},${w.isProtected ? 'Protected' : 'Unprotected'},${
              Math.round((w.sizeBytes / 1e9) * 10) / 10
            },${w.dbEngine}`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Veeam_Docker_SLA_Compliance_Report_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('SLA & Capacity Compliance Report downloaded as CSV.');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-emerald-400" />
          <h2 className="text-xs font-semibold text-white tracking-tight">
            Veeam ONE Enterprise Reporting &amp; SLA Compliance
          </h2>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
        >
          <Download size={13} />
          <span>Export Audit Report (CSV)</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-950/80 border-b border-emerald-600/50 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{downloadSuccess}</span>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* SLA Compliance Section */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Target RPO Compliance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white font-mono">{slaCompliancePct}%</span>
              <span className="text-xs text-amber-400 font-medium">2 Non-Compliant</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {protectedCount} of {totalCount} discovered Docker workloads backed up within 24-hour RPO.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Backup Verification SLA</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400 font-mono">100%</span>
              <span className="text-xs text-slate-400">SureBackup verified</span>
            </div>
            <p className="text-[11px] text-slate-400">
              All active production backup chains passed automated isolated sandbox recovery.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Nearest Capacity Exhaustion</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-400 font-mono">42 Days</span>
              <span className="text-xs text-slate-400">NFS Secondary Vault</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Secondary vault usage growing at 110 GB/week. Additional extent recommended.
            </p>
          </div>
        </div>

        {/* System Alarms */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-slate-850/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-amber-400" />
              <span className="font-semibold text-white">Active System Alarms ({alarms.length})</span>
            </div>
          </div>

          <div className="divide-y divide-slate-850 text-xs">
            {alarms.map(alm => (
              <div key={alm.id} className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{alm.title}</span>
                    <span
                      className={`text-[10px] uppercase font-mono px-2 py-0.2 rounded font-bold ${
                        alm.severity === 'error'
                          ? 'bg-red-950 text-red-400'
                          : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {alm.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{alm.timestamp}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{alm.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  {!alm.acknowledged ? (
                    <button
                      onClick={() => veeamStore.acknowledgeAlarm(alm.id)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 transition-colors"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check size={12} /> Acknowledged
                    </span>
                  )}
                  <button
                    onClick={() => veeamStore.dismissAlarm(alm.id)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white rounded text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
