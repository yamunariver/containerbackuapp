import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { ManagedServer, BackupProxy, BackupRepository } from '../../types/veeam';
import {
  Server,
  Activity,
  HardDrive,
  ShieldCheck,
  RotateCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Cpu,
} from 'lucide-react';

interface Props {
  onOpenAddServer: () => void;
  onOpenAddRepo: () => void;
}

export const InfrastructureView: React.FC<Props> = ({
  onOpenAddServer,
  onOpenAddRepo,
}) => {
  const [subTab, setSubTab] = useState<'servers' | 'proxies' | 'repositories'>('servers');
  const servers = veeamStore.getServers();
  const proxies = veeamStore.getProxies();
  const repos = veeamStore.getRepositories();
  const scaleOut = veeamStore.getScaleOut();

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      {/* Subtab Bar */}
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setSubTab('servers')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'servers'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Managed Linux Servers ({servers.length})
          </button>
          <button
            onClick={() => setSubTab('proxies')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'proxies'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Backup Proxies ({proxies.length})
          </button>
          <button
            onClick={() => setSubTab('repositories')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'repositories'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Backup Repositories &amp; SOBR ({repos.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {subTab === 'servers' && (
            <button
              onClick={onOpenAddServer}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
            >
              <Plus size={13} />
              <span>Add Managed Linux Server</span>
            </button>
          )}

          {subTab === 'repositories' && (
            <button
              onClick={onOpenAddRepo}
              className="flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors"
            >
              <Plus size={13} />
              <span>Add Backup Repository</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* TAB 1: MANAGED SERVERS */}
        {subTab === 'servers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {servers.map(srv => {
                const usedSpace = srv.totalSpaceGB - srv.freeSpaceGB;
                const usedPct = Math.round((usedSpace / srv.totalSpaceGB) * 100);

                return (
                  <div
                    key={srv.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server size={18} className="text-amber-400" />
                          <h3 className="text-xs font-semibold text-white tracking-tight">
                            {srv.name}
                          </h3>
                        </div>
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-mono uppercase font-bold">
                          {srv.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-1">
                        SSH: {srv.host}:{srv.sshPort} · {srv.sudoMode ? 'Sudo Root' : 'Rootless'}
                      </span>
                    </div>

                    <div className="space-y-2 bg-slate-950 border border-slate-850 rounded p-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Docker Engine:</span>
                        <span className="text-white font-mono">{srv.dockerVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Helper Image:</span>
                        <span className="text-white font-mono text-[10px] truncate max-w-[140px]">
                          {srv.helperImage}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stream Utilities:</span>
                        <span className="text-emerald-400 font-mono">zstd + tar present</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">TOFU Key Fingerprint:</span>
                        <span className="text-emerald-400 font-mono text-[10px]">Pinned</span>
                      </div>
                    </div>

                    {/* Storage bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Remote Scratch Disk</span>
                        <span className="font-mono text-slate-300">
                          {srv.freeSpaceGB} GB free of {srv.totalSpaceGB} GB
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono text-[10px]">
                        Probe: {srv.lastCheckedAt.substring(11, 19)}
                      </span>
                      <button
                        onClick={() => veeamStore.runComponentCheck(srv.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <RotateCw size={11} className="text-emerald-400" />
                        Component Check
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: BACKUP PROXIES */}
        {subTab === 'proxies' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {proxies.map(prx => {
                const srv = servers.find(s => s.id === prx.hostId);
                const loadPct = Math.round((prx.activeTasks / prx.maxConcurrentTasks) * 100);

                return (
                  <div
                    key={prx.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity size={18} className="text-sky-400" />
                        <div>
                          <h3 className="text-xs font-semibold text-white tracking-tight">
                            {prx.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Host: {srv?.name || prx.hostId}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800/40 px-2 py-0.5 rounded font-mono uppercase font-bold">
                        {prx.status}
                      </span>
                    </div>

                    {/* Concurrent Task Slots Meter */}
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Concurrent Task Slot Utilization:</span>
                        <span className="text-white font-mono font-semibold">
                          {prx.activeTasks} / {prx.maxConcurrentTasks} slots ({loadPct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full"
                          style={{ width: `${Math.max(5, loadPct)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Veeam Task Slot Semaphore: Workloads queue automatically when slots are saturated.
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <span className="text-slate-400 block text-[11px] mb-1">Pinned Managed Hosts:</span>
                      <div className="flex gap-2">
                        {prx.pinnedHostIds.map(hId => (
                          <span
                            key={hId}
                            className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-300"
                          >
                            {hId}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: REPOSITORIES & SOBR */}
        {subTab === 'repositories' && (
          <div className="space-y-6">
            {/* Scale-Out Backup Repository (SOBR) Banner */}
            <div className="bg-slate-900 border border-purple-800/40 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-purple-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Scale-Out Backup Repository: SOBR-Production-Tier1
                  </h3>
                </div>
                <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-800/40 px-2 py-0.5 rounded font-mono">
                  Placement: Data Locality
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Groups 2 physical extents (repo-01 NVMe + repo-02 NFS Vault) into a single logical target. Automatically balances chain placement, with support for extent maintenance mode and live evacuation.
              </p>
            </div>

            {/* Repositories Master Cards */}
            <div className="grid grid-cols-3 gap-4">
              {repos.map(r => {
                const usedGB = r.capacityGB - r.freeGB;
                const usedPct = Math.round((usedGB / r.capacityGB) * 100);

                return (
                  <div
                    key={r.id}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive size={18} className="text-purple-400" />
                          <h3 className="text-xs font-semibold text-white truncate max-w-[140px]">
                            {r.name}
                          </h3>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">
                          {r.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-1 truncate">
                        {r.path}
                      </span>
                    </div>

                    <div className="space-y-2 bg-slate-950 border border-slate-850 rounded p-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Concurrent Slots:</span>
                        <span className="text-white font-mono">{r.activeTasks} / {r.maxConcurrentTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hardened Immutability:</span>
                        <span className="text-emerald-400 font-mono font-medium">
                          {r.immutabilityDays > 0 ? `${r.immutabilityDays} Days (WORM)` : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Rate Limit:</span>
                        <span className="text-white font-mono">
                          {r.rateLimitMBs > 0 ? `${r.rateLimitMBs} MB/s` : 'Unlimited'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">SOBR Extent:</span>
                        <span className="text-purple-400 font-mono">
                          {r.isScaleOutExtent ? 'Extent 1 (Active)' : 'Standalone'}
                        </span>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Provisioned Space</span>
                        <span className="font-mono text-slate-300">{usedGB} GB of {r.capacityGB} GB</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${usedPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono text-[10px]">
                        Rescanned: {r.lastRescanAt.substring(11, 16)}
                      </span>
                      <button
                        onClick={() => veeamStore.addAuditLog('REPOSITORY_RESCAN', r.name, 'Manual rescan executed')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <RotateCw size={11} className="text-purple-400" />
                        Rescan Storage
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
