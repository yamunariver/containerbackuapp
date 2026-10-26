import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  BackupMode,
  CompressionLevel,
  DbEngine,
  QuiesceStrategy,
} from '../../types/veeam';
import {
  Calendar,
  Layers,
  Database,
  Shield,
  HardDrive,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle,
  FileText,
  Boxes,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const NewBackupJobWizard: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const workloads = veeamStore.getWorkloads();
  const repositories = veeamStore.getRepositories();
  const existingJobs = veeamStore.getJobs();

  // Step 1: Name & Desc
  const [jobName, setJobName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Workloads
  const [selectedWlIds, setSelectedWlIds] = useState<string[]>([workloads[0]?.id || '']);
  const [filterLabel, setFilterLabel] = useState('');

  // Step 3: Storage & Retention
  const [selectedRepoId, setSelectedRepoId] = useState(repositories[0]?.id || '');
  const [backupMode, setBackupMode] = useState<BackupMode>('forever_forward');
  const [retentionPoints, setRetentionPoints] = useState(14);
  const [gfsWeekly, setGfsWeekly] = useState(4);
  const [gfsMonthly, setGfsMonthly] = useState(12);
  const [gfsYearly, setGfsYearly] = useState(2);
  const [immutabilityDays, setImmutabilityDays] = useState(14);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('optimal');
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);

  // Step 4: Guest Processing
  const [guestProcessingEnabled, setGuestProcessingEnabled] = useState(true);
  const [dbEngine, setDbEngine] = useState<DbEngine>('postgres');
  const [quiesceStrategy, setQuiesceStrategy] = useState<QuiesceStrategy>('app_aware');
  const [dbUser, setDbUser] = useState('postgres');
  const [preFreezeScript, setPreFreezeScript] = useState('pg_dumpall -U postgres -f /var/tmp/consistent_dump.sql');
  const [failOnError, setFailOnError] = useState(true);

  // Step 5: Schedule
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [frequency, setFrequency] = useState<'daily' | 'hourly' | 'cron'>('daily');
  const [time, setTime] = useState('02:00 UTC');
  const [runAfterJobId, setRunAfterJobId] = useState<string>('');
  const [retryCount, setRetryCount] = useState(3);
  const [retryDelay, setRetryDelay] = useState(10);
  const [runImmediately, setRunImmediately] = useState(false);

  const toggleWorkload = (id: string) => {
    setSelectedWlIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    const newJob = veeamStore.addJob({
      name: jobName || 'Docker Backup Job',
      description,
      workloadIds: selectedWlIds,
      repositoryId: selectedRepoId,
      backupMode,
      retentionPoints,
      gfsPolicy: {
        weeklyCount: gfsWeekly,
        monthlyCount: gfsMonthly,
        yearlyCount: gfsYearly,
      },
      immutabilityDays,
      guestProcessing: {
        enabled: guestProcessingEnabled,
        dbEngine,
        quiesceStrategy,
        dbUser,
        preFreezeScript,
        failOnError,
      },
      schedule: {
        enabled: scheduleEnabled,
        frequency,
        cronExpression: '0 2 * * *',
        time,
        runAfterJobId: runAfterJobId || undefined,
        retryCount,
        retryDelayMinutes: retryDelay,
        missedRunPolicy: 'run_immediately',
      },
      compressionLevel,
      encryptionEnabled,
    });

    if (runImmediately) {
      veeamStore.startJob(newJob.id);
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded text-emerald-400">
              <Boxes size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                New Backup Job Wizard
              </h2>
              <span className="text-xs text-slate-400">
                Step {step} of 6: {
                  step === 1 ? 'Job Name & Description' :
                  step === 2 ? 'Virtual Workloads & Containers' :
                  step === 3 ? 'Storage & GFS Retention' :
                  step === 4 ? 'Guest Processing (Application-Aware)' :
                  step === 5 ? 'Schedule & Chaining' : 'Summary'
                }
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-6 bg-slate-950/60 border-b border-slate-800 text-[11px] font-medium text-slate-400">
          <div className={`py-2 text-center border-b-2 ${step === 1 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            1. Name
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 2 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            2. Workloads
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 3 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            3. Storage
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 4 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            4. Guest DB
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 5 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            5. Schedule
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 6 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            6. Summary
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Backup Job Name</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Production Stacks (Forever Forward)"
                  value={jobName}
                  onChange={e => setJobName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Operational notes, backup window constraints, SLA targets..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded text-slate-300 text-[11px] leading-relaxed">
                Veeam Backup Jobs protect one or more remote Docker workloads (Compose projects, containers, or named volumes), generating a synthetic full or incremental backup chain on designated storage repositories.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200">Select Docker Workloads to Protect</h3>
                  <span className="text-slate-400 text-[11px]">Pick Compose stacks or standalone containers across managed hosts.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Dynamic Label Filter:</span>
                  <input
                    type="text"
                    placeholder="backup=true"
                    value={filterLabel}
                    onChange={e => setFilterLabel(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500 w-28"
                  />
                </div>
              </div>

              <div className="border border-slate-800 rounded bg-slate-950 max-h-64 overflow-y-auto divide-y divide-slate-850">
                {workloads.map(wl => {
                  const isChecked = selectedWlIds.includes(wl.id);
                  return (
                    <div
                      key={wl.id}
                      onClick={() => toggleWorkload(wl.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-950/40 border-l-2 border-emerald-500' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="accent-emerald-500 rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-100">{wl.name}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                              {wl.type === 'compose_stack' ? 'Compose Project' : 'Container'}
                            </span>
                            {wl.dbEngine !== 'none' && (
                              <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800/40 px-1.5 py-0.2 rounded font-mono">
                                {wl.dbEngine.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Host: {wl.serverName} · Containers: {wl.containers.join(', ')} · Volumes: {wl.volumes.length}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-300 font-mono">
                          {Math.round(wl.sizeBytes / 1e9 * 10) / 10} GB
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <span className="text-[11px] text-slate-400 block">
                Selected {selectedWlIds.length} workloads. Volume data will be streamed without stopping containers unless Quiesce is enabled.
              </span>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Target Backup Repository</label>
                <select
                  value={selectedRepoId}
                  onChange={e => setSelectedRepoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {repositories.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type.toUpperCase()} · {r.freeGB} GB free of {r.capacityGB} GB)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Backup Chain Mode</label>
                  <select
                    value={backupMode}
                    onChange={e => setBackupMode(e.target.value as BackupMode)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="forever_forward">Forever Forward Incremental (Synthetic Merge)</option>
                    <option value="forward_incremental">Forward Incremental (Periodic Active Fulls)</option>
                    <option value="reverse_incremental">Reverse Incremental</option>
                  </select>
                  <span className="text-slate-400 text-[11px] mt-0.5 block">
                    Automatically merges oldest increment into full without consuming extra capacity.
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Restore Points to Retain</label>
                  <input
                    type="number"
                    value={retentionPoints}
                    onChange={e => setRetentionPoints(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-slate-400 text-[11px] mt-0.5 block">
                    Daily operational restore points before consolidation.
                  </span>
                </div>
              </div>

              {/* GFS Retention */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">
                  Grandfather-Father-Son (GFS) Long-Term Retention
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Keep Weekly Fulls</label>
                    <input
                      type="number"
                      value={gfsWeekly}
                      onChange={e => setGfsWeekly(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Keep Monthly Fulls</label>
                    <input
                      type="number"
                      value={gfsMonthly}
                      onChange={e => setGfsMonthly(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Keep Yearly Fulls</label>
                    <input
                      type="number"
                      value={gfsYearly}
                      onChange={e => setGfsYearly(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Immutability & Compression */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Make Restore Points Immutable</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={immutabilityDays}
                      onChange={e => setImmutabilityDays(Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                    />
                    <span className="text-slate-400 text-xs">days (WORM lock)</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Compression Engine</label>
                  <select
                    value={compressionLevel}
                    onChange={e => setCompressionLevel(e.target.value as CompressionLevel)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="fast">Fast (zstd -1)</option>
                    <option value="optimal">Optimal (zstd -3, recommended)</option>
                    <option value="high">High (zstd -9, maximum ratio)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded">
                <div>
                  <span className="font-medium text-slate-200 block">Enable Application-Aware Processing</span>
                  <span className="text-slate-400 text-[11px]">
                    Creates transactionally consistent database backups without halting containers.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={guestProcessingEnabled}
                  onChange={e => setGuestProcessingEnabled(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {guestProcessingEnabled && (
                <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">Database Engine Profile</label>
                      <select
                        value={dbEngine}
                        onChange={e => setDbEngine(e.target.value as DbEngine)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="postgres">PostgreSQL (pg_dump / pg_basebackup)</option>
                        <option value="mysql">MariaDB / MySQL (mysqldump --single-transaction)</option>
                        <option value="mongo">MongoDB (mongodump / fsyncLock)</option>
                        <option value="redis">Redis (BGSAVE & LASTSAVE polling)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-medium block mb-1">Quiesce Strategy</label>
                      <select
                        value={quiesceStrategy}
                        onChange={e => setQuiesceStrategy(e.target.value as QuiesceStrategy)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="app_aware">Application-Aware Hot Dump (Zero Downtime)</option>
                        <option value="pause">Docker Pause Container During Volume Read</option>
                        <option value="none">Crash-Consistent Volume Stream Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Pre-Freeze / Consistency Command</label>
                    <input
                      type="text"
                      value={preFreezeScript}
                      onChange={e => setPreFreezeScript(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono text-[11px]"
                    />
                    <span className="text-slate-400 text-[10px] mt-0.5 block">
                      Executed directly inside the target DB container via docker exec.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      checked={failOnError}
                      onChange={e => setFailOnError(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="text-slate-300 text-[11px]">
                      Fail job if DB transaction dump or quiesce hook fails (ensures zero data loss).
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded">
                <div>
                  <span className="font-medium text-slate-200 block">Run Automatically on Schedule</span>
                  <span className="text-slate-400 text-[11px]">Managed by central Celery Beat scheduler with timezone awareness.</span>
                </div>
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={e => setScheduleEnabled(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              {scheduleEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Execution Schedule</label>
                    <input
                      type="text"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      placeholder="e.g. 02:00 UTC"
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Job Chaining (&ldquo;Run After&rdquo;)</label>
                    <select
                      value={runAfterJobId}
                      onChange={e => setRunAfterJobId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      <option value="">None (Standalone Schedule)</option>
                      {existingJobs.map(j => (
                        <option key={j.id} value={j.id}>
                          Run immediately after &ldquo;{j.name}&rdquo; completes
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Automatic Retry on Failure</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={retryCount}
                        onChange={e => setRetryCount(Number(e.target.value))}
                        className="w-20 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                      <span className="text-slate-400 text-xs">attempts with</span>
                      <input
                        type="number"
                        value={retryDelay}
                        onChange={e => setRetryDelay(Number(e.target.value))}
                        className="w-20 bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                      <span className="text-slate-400 text-xs">min delay</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-200">Review Backup Job Configuration</h3>
              <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Job Name</span>
                    <span className="text-white font-medium">{jobName || 'Docker Backup Job'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Workloads</span>
                    <span className="text-white font-mono">{selectedWlIds.length} items selected</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Chain Mode</span>
                    <span className="text-white capitalize">{backupMode.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Retention</span>
                    <span className="text-white">{retentionPoints} restore points · GFS ({gfsWeekly}W / {gfsMonthly}M / {gfsYearly}Y)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Immutability</span>
                    <span className="text-emerald-400 font-medium">{immutabilityDays > 0 ? `${immutabilityDays} Days (WORM)` : 'Disabled'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Guest DB Processing</span>
                    <span className="text-white">{guestProcessingEnabled ? `App-aware ${dbEngine.toUpperCase()}` : 'Standard volume read'}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={runImmediately}
                    onChange={e => setRunImmediately(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span className="text-emerald-400 font-medium">
                    Run the job when I click Finish (Initial Full Backup)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-800/80 px-6 py-3 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-600 transition-colors disabled:opacity-40"
          >
            <ArrowLeft size={13} />
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs font-medium border border-slate-700 transition-colors"
            >
              Cancel
            </button>

            {step < 6 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !jobName}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors disabled:opacity-40"
              >
                Next
                <ArrowRight size={13} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
              >
                Finish & Create Job
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
