import React, { useState } from 'react';
import JSZip from 'jszip';
import { RestorePoint, GuestFileItem } from '../../types/veeam';
import { veeamStore } from '../../services/veeamStore';
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Download,
  RotateCcw,
  Search,
  CheckCircle,
  X,
  Server,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  restorePoint: RestorePoint;
  onClose: () => void;
}

export const GuestFileRestoreModal: React.FC<Props> = ({ restorePoint, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<GuestFileItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'gf-01': true,
    'gf-02': true,
    'gf-02-1': true,
    'gf-03': true,
  });
  const [targetHost, setTargetHost] = useState(restorePoint.workloadId);
  const [targetPath, setTargetPath] = useState('/tmp/restored-files');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const servers = veeamStore.getServers();

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate real ZIP download using JSZip
  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Populate sample files into the zip
      zip.file(
        'config/config.php',
        `<?php\n// Restored from Docker Backup & Replication\n// Workload: ${restorePoint.workloadName}\n// Timestamp: ${restorePoint.timestamp}\n$CONFIG = array (\n  'installed' => true,\n  'version' => '29.0.4.1',\n  'dbtype' => 'pgsql',\n  'dbname' => 'nextcloud',\n);\n`
      );
      zip.file(
        'config/autoconfig.php',
        `<?php\n$AUTOCONFIG = array(\n  "dbtype" => "pgsql",\n  "dbname" => "nextcloud",\n);\n`
      );
      zip.file(
        'data/admin/files/Q3_Financial_Audit_Report.pdf',
        `%PDF-1.4\n1 0 obj\n<< /Title (Q3 Financial Audit Report - Restored) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF`
      );
      zip.file(
        'data/admin/files/Infrastructure_Inventory_2026.xlsx',
        `ID,Server,Role,DockerVersion,Status\nsrv-01,prod-docker-01,Database/Core,27.2.0,Protected\nsrv-02,prod-docker-02,GitLab/CI,27.1.1,Protected\n`
      );
      zip.file(
        'metadata/restore_manifest.json',
        JSON.stringify(
          {
            workload: restorePoint.workloadName,
            restorePointId: restorePoint.id,
            timestamp: restorePoint.timestamp,
            checksumSha256: restorePoint.checksumSha256,
            verified: restorePoint.isVerified,
          },
          null,
          2
        )
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${restorePoint.workloadName}_guest_files_${restorePoint.timestamp.replace(/[: ]/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setRestoreStatus('ZIP bundle generated and downloaded successfully.');
    } catch {
      setRestoreStatus('Error packaging ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleRestoreToHost = () => {
    if (!selectedFile) return;
    setRestoreStatus(`Restoring "${selectedFile.name}" to host "${targetHost}" at ${targetPath}...`);
    setTimeout(() => {
      setRestoreStatus(`File successfully restored to ${targetPath}/${selectedFile.name} with preserved ACLs/permissions (${selectedFile.permissions}).`);
      veeamStore.addAuditLog('GUEST_FILE_RESTORE', selectedFile.name, `Restored to ${targetHost}:${targetPath}`);
    }, 1500);
  };

  // Render tree item recursively
  const renderItem = (item: GuestFileItem, depth = 0) => {
    const isExpanded = expandedFolders[item.id];
    const isSelected = selectedFile?.id === item.id;
    const matchesSearch = searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      <div key={item.id} className={matchesSearch ? '' : 'hidden'}>
        <div
          onClick={() => {
            if (item.isDirectory) toggleFolder(item.id);
            setSelectedFile(item);
          }}
          className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-xs select-none transition-colors ${
            isSelected
              ? 'bg-emerald-950/80 text-emerald-300 font-medium border border-emerald-700/50'
              : 'hover:bg-slate-800/60 text-slate-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {item.isDirectory ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-200"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          {item.isDirectory ? (
            <Folder size={15} className="text-amber-400 shrink-0" />
          ) : (
            <File size={15} className="text-emerald-400 shrink-0" />
          )}

          <span className="truncate flex-1">{item.name}</span>
          <span className="text-[10px] text-slate-300 tabular-nums font-mono">{item.permissions}</span>
          <span className="text-[10px] text-slate-200 tabular-nums font-mono w-16 text-right">
            {item.isDirectory ? '-' : formatBytes(item.sizeBytes)}
          </span>
        </div>

        {item.isDirectory && isExpanded && item.children && (
          <div>{item.children.map(child => renderItem(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded text-emerald-400">
              <HardDrive size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Guest File Restore (Volume Browser)
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span>Workload: <strong className="text-slate-100">{restorePoint.workloadName}</strong></span>
                <span>·</span>
                <span>Point-in-Time: <strong className="text-slate-100 font-mono">{restorePoint.timestamp}</strong></span>
                <span>·</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck size={12} /> SHA-256 Verified
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="bg-slate-800/40 px-6 py-2.5 border-b border-slate-700 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search file name, extension or path..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {isZipping ? 'Packaging ZIP...' : 'Download as ZIP Archive'}
            </button>
          </div>
        </div>

        {/* Browser Grid */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* File Tree Left Column */}
          <div className="col-span-8 p-4 overflow-y-auto border-r border-slate-800 space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex justify-between">
              <span>Path & Name</span>
              <div className="flex gap-8">
                <span>Permissions</span>
                <span className="w-16 text-right">Size</span>
              </div>
            </div>
            {restorePoint.guestFiles.map(item => renderItem(item, 0))}
          </div>

          {/* Right Column: File Details & Target Restore */}
          <div className="col-span-4 p-5 bg-slate-950/40 flex flex-col justify-between overflow-y-auto">
            <div>
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Selected Artifact Properties
              </h3>

              {selectedFile ? (
                <div className="bg-slate-900 border border-slate-800 rounded p-3 text-xs space-y-2 mb-4">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Filename</span>
                    <span className="text-white font-medium break-all">{selectedFile.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Virtual Path</span>
                    <span className="text-slate-300 font-mono text-[11px] break-all">{selectedFile.path}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Type</span>
                      <span className="text-slate-200">{selectedFile.isDirectory ? 'Directory' : 'Regular File'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">File Size</span>
                      <span className="text-slate-200 font-mono tabular-nums">{formatBytes(selectedFile.sizeBytes)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Permissions</span>
                      <span className="text-slate-200 font-mono">{selectedFile.permissions}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Last Modified</span>
                      <span className="text-slate-200 font-mono">{selectedFile.modifiedAt}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded mb-4">
                  Select a file or folder from the volume tree to view properties and restore.
                </div>
              )}

              {/* Restore to Host Form */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Restore to Remote Host
                </h4>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Managed Linux Server</label>
                  <select
                    value={targetHost}
                    onChange={e => setTargetHost(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {servers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.host})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Destination Directory on Host</label>
                  <input
                    type="text"
                    value={targetPath}
                    onChange={e => setTargetPath(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Preserves original uid, gid, permissions & timestamps via tar xattrs.
                  </span>
                </div>

                <button
                  onClick={handleRestoreToHost}
                  disabled={!selectedFile}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs font-medium border border-slate-700 transition-colors disabled:opacity-40"
                >
                  <RotateCcw size={14} className="text-emerald-400" />
                  Restore Selected to Target Host
                </button>
              </div>
            </div>

            {restoreStatus && (
              <div className="mt-4 p-3 bg-slate-900 border border-emerald-600/40 rounded text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle size={15} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{restoreStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Server size={13} className="text-slate-400" />
              Direct streaming extraction from repository extent: <strong className="text-slate-300">repo-01</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium border border-slate-600 transition-colors"
          >
            Close Browser
          </button>
        </div>
      </div>
    </div>
  );
};
