export type JobStatus = 'idle' | 'running' | 'success' | 'warning' | 'failed' | 'disabled';
export type SessionStatus = 'queued' | 'starting' | 'running' | 'success' | 'warning' | 'failed' | 'cancelled';
export type BackupMode = 'forward_incremental' | 'forever_forward' | 'reverse_incremental';
export type CompressionLevel = 'none' | 'fast' | 'optimal' | 'high';
export type WorkloadType = 'container' | 'compose_stack' | 'volume_set';
export type DbEngine = 'postgres' | 'mysql' | 'mongo' | 'redis' | 'none';
export type QuiesceStrategy = 'none' | 'pause' | 'stop' | 'app_aware';
export type RepoType = 'local' | 'nfs' | 'smb' | 's3';
export type RestoreType = 'full' | 'incremental' | 'synthetic_full';
export type RoleType = 'admin' | 'operator' | 'restore_operator' | 'auditor';

export interface ManagedServer {
  id: string;
  name: string;
  host: string;
  sshPort: number;
  credentialsId: string;
  sudoMode: boolean;
  tofuFingerprint: string;
  isFingerprintPinned: boolean;
  remoteWorkDir: string;
  status: 'online' | 'offline' | 'degraded';
  dockerVersion: string;
  helperImage: string;
  zstdAvailable: boolean;
  tarAvailable: boolean;
  freeSpaceGB: number;
  totalSpaceGB: number;
  lastCheckedAt: string;
  osInfo: string;
}

export interface Credential {
  id: string;
  name: string;
  username: string;
  type: 'ssh_key' | 'password';
  hasPassphrase: boolean;
  description: string;
  lastUsedAt: string;
  fingerprint?: string;
}

export interface BackupProxy {
  id: string;
  name: string;
  hostId: string;
  maxConcurrentTasks: number;
  activeTasks: number;
  status: 'online' | 'busy' | 'offline';
  pinnedHostIds: string[];
}

export interface BackupRepository {
  id: string;
  name: string;
  type: RepoType;
  path: string;
  capacityGB: number;
  freeGB: number;
  maxConcurrentTasks: number;
  activeTasks: number;
  rateLimitMBs: number;
  encryptionEnabled: boolean;
  immutabilityDays: number;
  warningThresholdPct: number;
  isScaleOutExtent: boolean;
  scaleOutRepoId?: string;
  maintenanceMode: boolean;
  lastRescanAt: string;
}

export interface ScaleOutRepository {
  id: string;
  name: string;
  extentIds: string[];
  placementPolicy: 'locality' | 'performance';
  maintenanceModeExtentId?: string;
}

export interface Workload {
  id: string;
  serverId: string;
  serverName: string;
  type: WorkloadType;
  name: string;
  composeProject?: string;
  containers: string[];
  volumes: string[];
  bindMounts: string[];
  labels: Record<string, string>;
  isProtected: boolean;
  protectedByJobId?: string;
  dbEngine: DbEngine;
  sizeBytes: number;
  status: 'running' | 'exited' | 'paused';
}

export interface BackupJob {
  id: string;
  name: string;
  description: string;
  workloadIds: string[];
  repositoryId: string;
  backupMode: BackupMode;
  retentionPoints: number;
  gfsPolicy: {
    weeklyCount: number;
    monthlyCount: number;
    yearlyCount: number;
  };
  immutabilityDays: number;
  guestProcessing: {
    enabled: boolean;
    dbEngine: DbEngine;
    quiesceStrategy: QuiesceStrategy;
    dbUser?: string;
    preFreezeScript?: string;
    postThawScript?: string;
    failOnError: boolean;
  };
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'hourly' | 'cron';
    cronExpression: string;
    time: string;
    runAfterJobId?: string;
    retryCount: number;
    retryDelayMinutes: number;
    missedRunPolicy: 'run_immediately' | 'skip';
  };
  compressionLevel: CompressionLevel;
  encryptionEnabled: boolean;
  status: JobStatus;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastDurationSec: number;
  lastTransferredBytes: number;
  lastResult: 'success' | 'warning' | 'failed' | null;
  recentRuns: ('success' | 'warning' | 'failed')[];
}

export interface BackupCopyJob {
  id: string;
  name: string;
  sourceJobId: string;
  sourceRepoId: string;
  targetRepoId: string;
  mode: 'immediate' | 'periodic';
  bandwidthLimitMBs: number;
  retentionPoints: number;
  gfsEnabled: boolean;
  status: JobStatus;
  lastRunAt: string | null;
  copyLagMinutes: number;
}

export interface RestorePointArtifact {
  id: string;
  name: string;
  type: 'volume_archive' | 'db_dump' | 'metadata_json' | 'compose_manifest' | 'image_tar';
  sizeBytes: number;
  checksumSha256: string;
  compressionRatio: number;
}

export interface GuestFileItem {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modifiedAt: string;
  permissions: string;
  children?: GuestFileItem[];
}

export interface RestorePoint {
  id: string;
  jobId: string;
  jobName: string;
  workloadId: string;
  workloadName: string;
  repositoryId: string;
  timestamp: string;
  type: RestoreType;
  sizeBytes: number;
  dataTransferredBytes: number;
  dedupeRatio: number;
  compressionRatio: number;
  checksumSha256: string;
  isVerified: boolean;
  verificationPassed: boolean;
  immutabilityUntil: string | null;
  gfsFlag: 'W' | 'M' | 'Y' | null;
  artifacts: RestorePointArtifact[];
  guestFiles: GuestFileItem[];
  metadata: {
    containerConfig?: Record<string, unknown>;
    composeYaml?: string;
    environmentVars?: Record<string, string>;
    ports?: string[];
    volumes?: string[];
  };
}

export interface SessionLogLine {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  phase: 'queued' | 'scheduling' | 'preflight' | 'guest_processing' | 'transfer' | 'finalizing' | 'verification' | 'completed';
  message: string;
}

export interface JobSession {
  id: string;
  jobId: string;
  jobName: string;
  type: 'backup' | 'copy' | 'surebackup' | 'restore';
  status: SessionStatus;
  startTime: string;
  endTime: string | null;
  durationSec: number;
  progressPct: number;
  currentWorkload?: string;
  processingRateMBs: number;
  bottleneck: {
    sourcePct: number;
    proxyPct: number;
    networkPct: number;
    targetPct: number;
  };
  transferredBytes: number;
  totalBytes: number;
  dedupeRatio: number;
  compressionRatio: number;
  logs: SessionLogLine[];
}

export interface InstantRecoverySession {
  id: string;
  restorePointId: string;
  workloadName: string;
  targetServerId: string;
  targetServerName: string;
  tempContainerName: string;
  publishedPort: number;
  status: 'running' | 'finalized' | 'discarded';
  startedAt: string;
  uptimeSeconds: number;
  memoryUsageMB: number;
  cpuPct: number;
}

export interface SureBackupJob {
  id: string;
  name: string;
  backupJobId: string;
  targetServerId: string;
  isolatedNetworkName: string;
  autoTearDown: boolean;
  testScript: string;
  healthCheckPort: number;
  healthCheckEndpoint: string;
  status: JobStatus;
  lastRunAt: string | null;
  lastResult: 'passed' | 'failed' | null;
}

export interface SureBackupSession {
  id: string;
  jobId: string;
  jobName: string;
  status: 'running' | 'passed' | 'failed';
  startTime: string;
  endTime: string | null;
  workloadTested: string;
  isolatedNetwork: string;
  checks: {
    name: string;
    status: 'pending' | 'passed' | 'failed';
    details: string;
  }[];
}

export interface Alarm {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: RoleType;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: RoleType;
  mfaEnabled: boolean;
}
