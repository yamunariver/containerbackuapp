import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { Workload } from '../../types/veeam';
import {
  Layers,
  Boxes,
  Database,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Search,
  HardDrive,
  Server,
} from 'lucide-react';

interface Props {
  onOpenNewJob: () => void;
}

export const InventoryView: React.FC<Props> = ({ onOpenNewJob }) => {
  const workloads = veeamStore.getWorkloads();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtected, setFilterProtected] = useState<'all' | 'protected' | 'unprotected'>('all');

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredWorkloads = workloads.filter(wl => {
    const matchesSearch =
      searchTerm === '' ||
      wl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wl.serverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterProtected === 'all' ||
      (filterProtected === 'protected' && wl.isProtected) ||
      (filterProtected === 'unprotected' && !wl.isProtected);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      {/* Header bar */}
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-emerald-400" />
            <h2 className="text-xs font-semibold text-white tracking-tight">
              Discovered Docker Inventory
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              ({workloads.length} workloads discovered over SSH)
            </span>
          </div>

          <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterProtected('all')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterProtected === 'all' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterProtected('protected')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterProtected === 'protected' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Protected ({workloads.filter(w => w.isProtected).length})
            </button>
            <button
              onClick={() => setFilterProtected('unprotected')}
              className={`px-2.5 py-0.5 rounded transition-colors ${
                filterProtected === 'unprotected' ? 'bg-amber-950 text-amber-300 font-medium' : 'text-slate-400'
              }`}
            >
              Unprotected ({workloads.filter(w => !w.isProtected).length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search containers, stacks, hosts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={onOpenNewJob}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            <span>Protect Workloads</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
              <th className="py-2.5 px-4">Workload Name</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Managed Host</th>
              <th className="py-2.5 px-3">Containers &amp; Volumes</th>
              <th className="py-2.5 px-3">App DB Engine</th>
              <th className="py-2.5 px-3">Estimated Size</th>
              <th className="py-2.5 px-3">Protection Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredWorkloads.map(wl => (
              <tr key={wl.id} className="hover:bg-slate-900/60 text-slate-300 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Boxes size={15} className="text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-white block">{wl.name}</span>
                      {wl.composeProject && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Compose: {wl.composeProject}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-3 px-3 uppercase font-mono text-[11px] text-slate-200">
                  {wl.type === 'compose_stack' ? 'Compose Stack' : 'Container'}
                </td>

                <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                  {wl.serverName}
                </td>

                <td className="py-3 px-3 text-[11px]">
                  <span className="text-slate-200 block">
                    {wl.containers.length} containers: {wl.containers.join(', ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {wl.volumes.length} named volumes · {wl.bindMounts.length} binds
                  </span>
                </td>

                <td className="py-3 px-3">
                  {wl.dbEngine !== 'none' ? (
                    <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800/40 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                      {wl.dbEngine}
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">-</span>
                  )}
                </td>

                <td className="py-3 px-3 font-mono text-[11px] text-slate-300 tabular-nums">
                  {formatBytes(wl.sizeBytes)}
                </td>

                <td className="py-3 px-3">
                  {wl.isProtected ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                      <ShieldCheck size={13} /> Protected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                      <AlertTriangle size={13} /> Unprotected
                    </span>
                  )}
                </td>

                <td className="py-3 px-4 text-right">
                  {!wl.isProtected ? (
                    <button
                      onClick={onOpenNewJob}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium transition-colors"
                    >
                      Add to Job
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">Job Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
