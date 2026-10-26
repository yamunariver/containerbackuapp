import React from 'react';
import {
  Folder,
  FolderOpen,
  Server,
  Layers,
  Database,
  Shield,
  HardDrive,
  Copy,
  Clock,
  AlertTriangle,
  FileText,
  Key,
  ShieldCheck,
  Zap,
  Activity,
  Boxes,
  FileCode,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { veeamStore } from '../services/veeamStore';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  count: number | null;
  alert?: boolean;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const VeeamLeftNav: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const jobs = veeamStore.getJobs();
  const servers = veeamStore.getServers();
  const repos = veeamStore.getRepositories();
  const workloads = veeamStore.getWorkloads();
  const unprotectedWls = workloads.filter(w => !w.isProtected);
  const runningJobs = jobs.filter(j => j.status === 'running');
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const restorePoints = veeamStore.getRestorePoints();
  const alarms = veeamStore.getAlarms().filter(a => !a.acknowledged);
  const irSessions = veeamStore.getInstantRecoverySessions().filter(s => s.status === 'running');

  const navSections: NavSection[] = [
    {
      title: 'Console Home',
      items: [
        { id: 'home', label: 'Executive Dashboard', icon: Activity, count: null },
        { id: 'jobs', label: 'Backup & Copy Jobs', icon: Boxes, count: jobs.length },
        { id: 'sessions', label: 'Last 24 Hours Sessions', icon: Clock, count: null },
      ],
    },
    {
      title: 'Docker Inventory',
      items: [
        { id: 'inventory', label: 'All Discovered Workloads', icon: Layers, count: workloads.length },
        { id: 'inventory', label: 'Unprotected Containers', icon: AlertTriangle, count: unprotectedWls.length, alert: true },
      ],
    },
    {
      title: 'Backup Infrastructure',
      items: [
        { id: 'infrastructure', label: 'Managed Linux Servers', icon: Server, count: servers.length },
        { id: 'infrastructure', label: 'Backup Proxies', icon: Activity, count: 2 },
        { id: 'infrastructure', label: 'Repositories & SOBR', icon: HardDrive, count: repos.length },
      ],
    },
    {
      title: 'Backups & Recovery',
      items: [
        { id: 'backups', label: 'Disk Restore Points', icon: Database, count: restorePoints.length },
        { id: 'instant-recovery', label: 'Instant Recovery (Live)', icon: Zap, count: irSessions.length, highlight: irSessions.length > 0 },
        { id: 'surebackup', label: 'SureBackup Verification', icon: ShieldCheck, count: 1 },
      ],
    },
    {
      title: 'Governance & Security',
      items: [
        { id: 'reports', label: 'SLA & Capacity Reports', icon: FileText, count: null },
        { id: 'reports', label: 'System Alarms', icon: AlertTriangle, count: alarms.length, alert: alarms.length > 0 },
        { id: 'security', label: 'Credentials & Audit Log', icon: Key, count: null },
        { id: 'codebase', label: 'Production Code & Deploy', icon: FileCode, count: null },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 select-none overflow-y-auto">
      <div className="p-3 text-[11px] font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-850 flex items-center justify-between">
        <span>Veeam Navigation Tree</span>
        <span className="text-[10px] text-emerald-400 font-mono">SSH Connected</span>
      </div>

      <div className="p-2 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider px-2 py-1 block">
              {section.title}
            </span>
            {section.items.map((item, itemIdx) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={itemIdx}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon
                      size={14}
                      className={
                        item.alert
                          ? 'text-amber-400'
                          : item.highlight
                          ? 'text-amber-400'
                          : isActive
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.count !== null && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        item.alert
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                          : item.highlight
                          ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Summary Widget */}
      <div className="mt-auto p-3 m-2 bg-slate-900/80 border border-slate-800 rounded text-[11px] text-slate-400 space-y-1.5">
        <div className="flex justify-between">
          <span>Active Tasks / Slots:</span>
          <span className="text-white font-mono font-medium">1 / 14</span>
        </div>
        <div className="flex justify-between">
          <span>Target Repository:</span>
          <span className="text-emerald-400 font-mono">repo-01 (NVMe)</span>
        </div>
        <div className="flex justify-between">
          <span>Data Protected:</span>
          <span className="text-white font-mono font-medium">196.4 GB</span>
        </div>
      </div>
    </aside>
  );
};
