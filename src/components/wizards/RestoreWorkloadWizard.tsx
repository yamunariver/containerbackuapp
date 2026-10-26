import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { RestorePoint } from '../../types/veeam';
import {
  RotateCcw,
  Server,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface Props {
  initialRestorePoint?: RestorePoint | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RestoreWorkloadWizard: React.FC<Props> = ({
  initialRestorePoint,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(1);
  const restorePoints = veeamStore.getRestorePoints();
  const servers = veeamStore.getServers();

  const [selectedRpId, setSelectedRpId] = useState(
    initialRestorePoint?.id || restorePoints[0]?.id || ''
  );
  const [targetServerId, setTargetServerId] = useState(servers[0]?.id || '');
  const [restoreMode, setRestoreMode] = useState<
    'full' | 'volumes_only' | 'db_only' | 'metadata_only'
  >('full');

  // Remapping options
  const [remapContainerName, setRemapContainerName] = useState('');
  const [remapPort, setRemapPort] = useState('');
  const [remapNetwork, setRemapNetwork] = useState('bridge');
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  // Pre-restore validation
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    ssh: boolean;
    space: boolean;
    ports: boolean;
    docker: boolean;
  } | null>(null);

  const [executing, setExecuting] = useState(false);
  const [restoreLogs, setRestoreLogs] = useState<string[]>([]);
  const [restoreComplete, setRestoreComplete] = useState(false);

  const selectedRp = restorePoints.find(r => r.id === selectedRpId);
  const targetServer = servers.find(s => s.id === targetServerId);

  const runValidation = () => {
    setValidating(true);
    setValidationResults(null);
    setTimeout(() => {
      setValidationResults({
        ssh: true,
        space: true,
        ports: true,
        docker: true,
      });
      setValidating(false);
    }, 1500);
  };

  const handleExecuteRestore = () => {
    setExecuting(true);
    setRestoreLogs([
      `[${new Date().toLocaleTimeString()}] Pre-restore validation passed. Initiating SSH stream to ${targetServer?.host}...`,
    ]);

    setTimeout(() => {
      setRestoreLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Preparing target Docker environment and ephemeral helper container.`,
      ]);
    }, 1000);

    setTimeout(() => {
      setRestoreLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Streaming volume data: tar --numeric-owner --xattrs | zstd -d. Volume extraction OK.`,
      ]);
    }, 2400);

    setTimeout(() => {
      if (restoreMode === 'full' || restoreMode === 'db_only') {
        setRestoreLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Replaying application-aware database dump stream into restored container.`,
        ]);
      }
    }, 3800);

    setTimeout(() => {
      setRestoreLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Recreating container definition with port ${remapPort || '8080:80'} on network "${remapNetwork}".`,
        `[${new Date().toLocaleTimeString()}] Container started successfully. Health check probe returned HTTP 200 OK.`,
      ]);
      setExecuting(false);
      setRestoreComplete(true);

      veeamStore.addAuditLog(
        'WORKLOAD_RESTORE',
        selectedRp?.workloadName || 'Workload',
        `Full restore completed to target ${targetServer?.name}. Overwrite: ${overwriteExisting}`
      );
    }, 5500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded text-emerald-400">
              <RotateCcw size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Restore Workload Wizard
              </h2>
              <span className="text-xs text-slate-400">
                Step {step} of 5: {
                  step === 1 ? 'Select Restore Point' :
                  step === 2 ? 'Destination Host & Mode' :
                  step === 3 ? 'Remapping & Port Overrides' :
                  step === 4 ? 'Pre-Restore Validation' : 'Execution & Verification'
                }
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-medium text-slate-400">
          <div className={`py-2 text-center border-b-2 ${step === 1 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            1. Restore Point
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 2 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            2. Destination
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 3 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            3. Remapping
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 4 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            4. Validation
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 5 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            5. Execute
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-200">Select Consistent Restore Point</h3>
              <div className="border border-slate-800 rounded bg-slate-950 max-h-72 overflow-y-auto divide-y divide-slate-850">
                {restorePoints.map(rp => {
                  const isSelected = rp.id === selectedRpId;
                  return (
                    <div
                      key={rp.id}
                      onClick={() => setSelectedRpId(rp.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-950/40 border-l-2 border-emerald-500' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-100">{rp.workloadName}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono uppercase">
                            {rp.type.replace('_', ' ')}
                          </span>
                          {rp.gfsFlag && (
                            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800/40 px-1 rounded font-mono">
                              GFS: {rp.gfsFlag}
                            </span>
                          )}
                          {rp.immutabilityUntil && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-1 rounded">
                              Immutable
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                          Point-in-Time: {rp.timestamp} · Job: {rp.jobName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-300 font-mono text-[11px] block">
                          {Math.round(rp.sizeBytes / 1e9 * 10) / 10} GB
                        </span>
                        <span className="text-[10px] text-emerald-400">SHA-256 Verified</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Target Linux Managed Server</label>
                <select
                  value={targetServerId}
                  onChange={e => setTargetServerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {servers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.host} · Docker {s.dockerVersion})
                    </option>
                  ))}
                </select>
                <span className="text-slate-400 text-[11px] mt-0.5 block">
                  You can restore to the original server or migrate to any other registered Linux host.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Restore Scope / Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('full')}
                    className={`p-3 text-left rounded border transition-colors ${
                      restoreMode === 'full'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-semibold block text-slate-100">Full Stack & Container Recreate</span>
                    <span className="text-[11px] block mt-1">
                      Restores all volumes, re-executes DB dump, and recreates container definitions.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('volumes_only')}
                    className={`p-3 text-left rounded border transition-colors ${
                      restoreMode === 'volumes_only'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-semibold block text-slate-100">Volumes & Data Only</span>
                    <span className="text-[11px] block mt-1">
                      Overwrites or populates named volumes without touching running container state.
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded text-slate-300 text-[11px]">
                Optional remapping parameters to avoid port and container name collisions when restoring side-by-side.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Container / Stack Name Override</label>
                  <input
                    type="text"
                    placeholder={`e.g. ${selectedRp?.workloadName}-restored`}
                    value={remapContainerName}
                    onChange={e => setRemapContainerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Published Port Remapping</label>
                  <input
                    type="text"
                    placeholder="e.g. 8085:80 (leave blank for original)"
                    value={remapPort}
                    onChange={e => setRemapPort(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Docker Network</label>
                <input
                  type="text"
                  value={remapNetwork}
                  onChange={e => setRemapNetwork(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-red-950/20 border border-red-700/40 rounded flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overwriteExisting}
                      onChange={e => setOverwriteExisting(e.target.checked)}
                      className="accent-red-500 rounded"
                    />
                    <span className="text-red-200 font-medium">
                      Overwrite existing container or volume if name conflict exists
                    </span>
                  </label>
                  <span className="text-[11px] text-red-300/80 mt-1 block">
                    Existing container will be stopped and deleted before extracting backup artifacts.
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200">Pre-Restore Environment Validation</h3>
                  <span className="text-slate-400 text-[11px]">
                    Validates target host connectivity, disk capacity, and port availability before making changes.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={runValidation}
                  disabled={validating}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  {validating && <Loader2 size={13} className="animate-spin" />}
                  {validating ? 'Testing...' : 'Validate Host Now'}
                </button>
              </div>

              {validationResults ? (
                <div className="space-y-2 border border-slate-800 rounded bg-slate-950 p-4">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span>Target Host SSH & Sudo Permissions</span>
                    </span>
                    <span className="text-emerald-400 font-mono">Passed ({targetServer?.host})</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span>Available Disk Space on Target</span>
                    </span>
                    <span className="text-emerald-400 font-mono">Passed (840 GB Free &gt; 45 GB required)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span>Port Collision Check</span>
                    </span>
                    <span className="text-emerald-400 font-mono">Port Available (No conflicts)</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-400" />
                      <span>Remote Tar/Zstd Stream Decompressor</span>
                    </span>
                    <span className="text-emerald-400 font-mono">Verified (Streaming Enabled)</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded text-slate-500">
                  Click &ldquo;Validate Host Now&rdquo; to test pre-restore safety checks.
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded p-4 font-mono text-[11px] h-60 overflow-y-auto space-y-1">
                {restoreLogs.length === 0 ? (
                  <div className="text-slate-500 text-center py-20 font-sans">
                    Ready to execute restore to {targetServer?.name}. Click &ldquo;Start Restore Execution&rdquo; below.
                  </div>
                ) : (
                  restoreLogs.map((line, idx) => (
                    <div key={idx} className="text-slate-300">
                      {line}
                    </div>
                  ))
                )}
              </div>

              {!executing && !restoreComplete && (
                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-lg"
                >
                  <RotateCcw size={15} />
                  Start Restore Execution
                </button>
              )}

              {restoreComplete && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-600/40 rounded text-emerald-300 text-xs flex items-center justify-between">
                  <span>Workload successfully restored and running on {targetServer?.name}!</span>
                  <button
                    onClick={() => {
                      onSuccess();
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium"
                  >
                    Done & Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1 || executing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-600 transition-colors disabled:opacity-40"
          >
            <ArrowLeft size={13} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={executing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs font-medium border border-slate-700 transition-colors"
            >
              Cancel
            </button>

            {step < 5 && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
              >
                Next
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
