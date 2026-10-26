import React, { useState } from 'react';
import {
  Play,
  Square,
  RotateCw,
  Plus,
  RotateCcw,
  Zap,
  HardDrive,
  FolderSearch,
  Server,
  Shield,
  Bell,
  UserCheck,
  CheckCircle,
  FileCode,
  Sliders,
  LogOut,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import { veeamStore } from '../services/veeamStore';
import { RoleType } from '../types/veeam';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddServer: () => void;
  onOpenNewJob: () => void;
  onOpenNewCopyJob: () => void;
  onOpenAddRepo: () => void;
  onOpenRestore: () => void;
  onOpenInstantRecovery: () => void;
  onOpenSureBackup: () => void;
  selectedJobId?: string | null;
}

export const VeeamTopRibbon: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  onOpenAddServer,
  onOpenNewJob,
  onOpenNewCopyJob,
  onOpenAddRepo,
  onOpenRestore,
  onOpenInstantRecovery,
  onOpenSureBackup,
  selectedJobId,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlarms, setShowAlarms] = useState(false);

  const currentUser = veeamStore.getCurrentUser();
  const alarms = veeamStore.getAlarms().filter(a => !a.acknowledged);

  const handleStartSelectedJob = () => {
    if (selectedJobId) {
      veeamStore.startJob(selectedJobId);
    } else {
      const firstJob = veeamStore.getJobs()[0];
      if (firstJob) veeamStore.startJob(firstJob.id);
    }
  };

  const handleStopSelectedJob = () => {
    if (selectedJobId) {
      veeamStore.stopJob(selectedJobId);
    } else {
      const runningJob = veeamStore.getJobs().find(j => j.status === 'running');
      if (runningJob) veeamStore.stopJob(runningJob.id);
    }
  };

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'backups', label: 'Backups' },
    { id: 'infrastructure', label: 'Backup Infrastructure' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'sessions', label: 'Last 24 Hours' },
    { id: 'surebackup', label: 'SureBackup' },
    { id: 'instant-recovery', label: 'Instant Recovery' },
    { id: 'reports', label: 'Reports & Alarms' },
    { id: 'security', label: 'Security & RBAC' },
    { id: 'codebase', label: 'Codebase & Deploy' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 select-none">
      {/* 1. Veeam Top Brand & Status Zone */}
      <div className="h-10 px-4 bg-slate-950 flex items-center justify-between border-b border-slate-850">
        <div className="flex items-center gap-3">
          {/* Veeam Emerald Icon Box */}
          <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center font-bold text-black text-xs">
            V
          </div>
          <span className="font-semibold text-white tracking-tight text-xs flex items-center gap-1.5">
            <span>Veeam Backup &amp; Replication</span>
            <span className="text-emerald-400 font-mono text-[11px] font-normal">v12 for Docker</span>
          </span>
          <span className="text-[11px] text-slate-300">· Central Controller (SSH Agentless)</span>
        </div>

        {/* Right Zone: Role Switcher & Alarms */}
        <div className="flex items-center gap-3">
          {/* Alarms indicator */}
          <div className="relative">
            <button
              onClick={() => setShowAlarms(!showAlarms)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            >
              <Bell size={13} className={alarms.length > 0 ? 'text-amber-400' : 'text-slate-400'} />
              <span>Alarms</span>
              {alarms.length > 0 && (
                <span className="bg-amber-600 text-white font-mono text-[10px] px-1 rounded-full font-bold">
                  {alarms.length}
                </span>
              )}
            </button>

            {/* Alarms Popover */}
            {showAlarms && (
              <div className="absolute right-0 top-8 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 z-50 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-slate-200">
                  <span>System Alarms ({alarms.length})</span>
                  <button
                    onClick={() => {
                      alarms.forEach(a => veeamStore.acknowledgeAlarm(a.id));
                      setShowAlarms(false);
                    }}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    Acknowledge All
                  </button>
                </div>
                {alarms.length === 0 ? (
                  <div className="py-4 text-center text-slate-500">No active unresolved alarms.</div>
                ) : (
                  alarms.map(alm => (
                    <div key={alm.id} className="p-2 bg-slate-950 border border-slate-800 rounded space-y-1">
                      <div className="flex items-center justify-between text-amber-400 font-medium">
                        <span>{alm.title}</span>
                        <span className="text-[10px] text-slate-300">{alm.timestamp.substring(11, 16)}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-tight">{alm.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <span className="text-slate-700">|</span>

          {/* Active User & RBAC Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-750 text-xs transition-colors"
            >
              <UserCheck size={13} className="text-emerald-400" />
              <span className="text-white font-medium">{currentUser.username}</span>
              <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-800 px-1 rounded">
                {currentUser.role.replace('_', ' ')}
              </span>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 top-8 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 text-xs space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block px-2 py-1">
                  Switch Active Role (RBAC)
                </span>
                {(
                  [
                    ['admin', 'Backup Administrator (Full Control)'],
                    ['operator', 'Backup Operator (Start/Stop Jobs)'],
                    ['restore_operator', 'Restore Operator (Restores Only)'],
                    ['auditor', 'Viewer / Security Auditor (Read-Only)'],
                  ] as [RoleType, string][]
                ).map(([r, label]) => (
                  <button
                    key={r}
                    onClick={() => {
                      veeamStore.setCurrentUserRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                      currentUser.role === r
                        ? 'bg-emerald-950 text-emerald-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Ribbon Tabs */}
      <nav className="flex items-center gap-1 px-3 bg-slate-900/90 border-b border-slate-800 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-emerald-500 text-white bg-slate-800/80 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 3. Contextual Action Toolbar Strip */}
      <div className="h-11 px-4 bg-slate-900 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Action button: Start */}
          <button
            onClick={handleStartSelectedJob}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors shadow-sm"
          >
            <Play size={12} className="fill-white" />
            <span>Start Job</span>
          </button>

          {/* Action button: Stop */}
          <button
            onClick={handleStopSelectedJob}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <Square size={12} />
            <span>Stop</span>
          </button>

          <span className="h-4 w-[1px] bg-slate-750 mx-1" />

          {/* Wizard trigger buttons */}
          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <Plus size={13} className="text-emerald-400" />
            <span>New Backup Job</span>
          </button>

          <button
            onClick={onOpenNewCopyJob}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <Plus size={13} className="text-sky-400" />
            <span>Backup Copy Job</span>
          </button>

          <button
            onClick={onOpenAddServer}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <Server size={13} className="text-amber-400" />
            <span>Add Server</span>
          </button>

          <button
            onClick={onOpenAddRepo}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <HardDrive size={13} className="text-purple-400" />
            <span>Add Repository</span>
          </button>

          <span className="h-4 w-[1px] bg-slate-750 mx-1" />

          {/* Recovery Tools */}
          <button
            onClick={onOpenRestore}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw size={13} className="text-emerald-400" />
            <span>Restore Workload</span>
          </button>

          <button
            onClick={onOpenInstantRecovery}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <Zap size={13} className="text-amber-400" />
            <span>Instant Recovery</span>
          </button>

          <button
            onClick={onOpenSureBackup}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            <Shield size={13} className="text-teal-400" />
            <span>SureBackup</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            Status: <span className="text-emerald-400 font-semibold">Ready</span>
          </span>
        </div>
      </div>
    </header>
  );
};
