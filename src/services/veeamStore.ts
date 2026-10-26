import {
  ManagedServer,
  Credential,
  BackupProxy,
  BackupRepository,
  ScaleOutRepository,
  Workload,
  BackupJob,
  BackupCopyJob,
  RestorePoint,
  JobSession,
  SessionLogLine,
  InstantRecoverySession,
  SureBackupJob,
  SureBackupSession,
  Alarm,
  AuditLogEntry,
  UserAccount,
  GuestFileItem,
} from '../types/veeam';

const INITIAL_SERVERS: ManagedServer[] = [
  {
    id: 'srv-01',
    name: 'prod-docker-01.us-east.corp',
    host: '10.240.10.15',
    sshPort: 22,
    credentialsId: 'cred-01',
    sudoMode: true,
    tofuFingerprint: 'SHA256:d8a9f4c3b2e1...8f0a (ed25519)',
    isFingerprintPinned: true,
    remoteWorkDir: '/var/tmp/veeam-docker',
    status: 'online',
    dockerVersion: '27.2.0 (API 1.47)',
    helperImage: 'cr.corp.internal/backup/helper:v2.4',
    zstdAvailable: true,
    tarAvailable: true,
    freeSpaceGB: 840,
    totalSpaceGB: 1200,
    lastCheckedAt: '2026-10-25 22:45:10',
    osInfo: 'Ubuntu 24.04 LTS (Kernel 6.8.0-45-generic)',
  },
  {
    id: 'srv-02',
    name: 'prod-docker-02.eu-west.corp',
    host: '10.240.20.28',
    sshPort: 2222,
    credentialsId: 'cred-02',
    sudoMode: true,
    tofuFingerprint: 'SHA256:4a8b7c9e0f12...bcde (rsa-4096)',
    isFingerprintPinned: true,
    remoteWorkDir: '/var/tmp/veeam-docker',
    status: 'online',
    dockerVersion: '27.1.1 (API 1.46)',
    helperImage: 'cr.corp.internal/backup/helper:v2.4',
    zstdAvailable: true,
    tarAvailable: true,
    freeSpaceGB: 410,
    totalSpaceGB: 800,
    lastCheckedAt: '2026-10-25 22:42:00',
    osInfo: 'Debian 12.6 bookworm (Kernel 6.1.0-22-amd64)',
  },
  {
    id: 'srv-03',
    name: 'staging-docker-03.us-east.corp',
    host: '10.240.10.88',
    sshPort: 22,
    credentialsId: 'cred-01',
    sudoMode: false,
    tofuFingerprint: 'SHA256:99ff3322aa11...5566 (ed25519)',
    isFingerprintPinned: true,
    remoteWorkDir: '/tmp/veeam-agent',
    status: 'online',
    dockerVersion: '26.1.4 (API 1.45)',
    helperImage: 'alpine:latest',
    zstdAvailable: true,
    tarAvailable: true,
    freeSpaceGB: 220,
    totalSpaceGB: 500,
    lastCheckedAt: '2026-10-25 22:30:15',
    osInfo: 'Ubuntu 22.04.4 LTS (Kernel 5.15.0-107-generic)',
  },
];

const INITIAL_CREDENTIALS: Credential[] = [
  {
    id: 'cred-01',
    name: 'svc-backup-ed25519',
    username: 'veeam-backup',
    type: 'ssh_key',
    hasPassphrase: true,
    description: 'Production infrastructure automated backup key (ed25519, encrypted at rest)',
    lastUsedAt: '2026-10-25 22:45:10',
    fingerprint: 'SHA256:d8a9f4c3b2e1...8f0a',
  },
  {
    id: 'cred-02',
    name: 'eu-devops-rsa4096',
    username: 'devops-admin',
    type: 'ssh_key',
    hasPassphrase: false,
    description: 'EU West Docker hosts service credential',
    lastUsedAt: '2026-10-25 22:42:00',
    fingerprint: 'SHA256:4a8b7c9e0f12...bcde',
  },
  {
    id: 'cred-03',
    name: 'postgres-db-dump-superuser',
    username: 'postgres',
    type: 'password',
    hasPassphrase: false,
    description: 'Application-aware pg_dump superuser password for Postgres containers',
    lastUsedAt: '2026-10-25 21:00:15',
  },
];

const INITIAL_PROXIES: BackupProxy[] = [
  {
    id: 'proxy-01',
    name: 'Default Backup Proxy (Controller)',
    hostId: 'srv-01',
    maxConcurrentTasks: 8,
    activeTasks: 1,
    status: 'online',
    pinnedHostIds: ['srv-01', 'srv-03'],
  },
  {
    id: 'proxy-02',
    name: 'EU Dedicated Proxy Worker',
    hostId: 'srv-02',
    maxConcurrentTasks: 6,
    activeTasks: 0,
    status: 'online',
    pinnedHostIds: ['srv-02'],
  },
];

const INITIAL_REPOSITORIES: BackupRepository[] = [
  {
    id: 'repo-01',
    name: 'Default NVMe Backup Repository',
    type: 'local',
    path: '/mnt/backup-storage/veeam-repo-01',
    capacityGB: 8000,
    freeGB: 4620,
    maxConcurrentTasks: 8,
    activeTasks: 1,
    rateLimitMBs: 0,
    encryptionEnabled: true,
    immutabilityDays: 14,
    warningThresholdPct: 85,
    isScaleOutExtent: true,
    scaleOutRepoId: 'sobr-01',
    maintenanceMode: false,
    lastRescanAt: '2026-10-25 21:30:00',
  },
  {
    id: 'repo-02',
    name: 'NFS-Secondary-Vault-Archive',
    type: 'nfs',
    path: '10.240.50.10:/exports/docker-backups',
    capacityGB: 16000,
    freeGB: 11200,
    maxConcurrentTasks: 4,
    activeTasks: 0,
    rateLimitMBs: 150,
    encryptionEnabled: true,
    immutabilityDays: 30,
    warningThresholdPct: 90,
    isScaleOutExtent: true,
    scaleOutRepoId: 'sobr-01',
    maintenanceMode: false,
    lastRescanAt: '2026-10-25 20:00:00',
  },
  {
    id: 'repo-03',
    name: 'S3-Wasabi-Immutable-Cloud',
    type: 's3',
    path: 's3://corp-veeam-immutable-west/docker/',
    capacityGB: 50000,
    freeGB: 46200,
    maxConcurrentTasks: 6,
    activeTasks: 0,
    rateLimitMBs: 80,
    encryptionEnabled: true,
    immutabilityDays: 60,
    warningThresholdPct: 95,
    isScaleOutExtent: false,
    maintenanceMode: false,
    lastRescanAt: '2026-10-25 18:15:00',
  },
];

const INITIAL_SCALE_OUT: ScaleOutRepository[] = [
  {
    id: 'sobr-01',
    name: 'SOBR-Production-Tier1',
    extentIds: ['repo-01', 'repo-02'],
    placementPolicy: 'locality',
  },
];

const INITIAL_WORKLOADS: Workload[] = [
  {
    id: 'wl-01',
    serverId: 'srv-01',
    serverName: 'prod-docker-01.us-east.corp',
    type: 'compose_stack',
    name: 'nextcloud-production',
    composeProject: 'nextcloud',
    containers: ['nextcloud-app', 'nextcloud-db-postgres', 'nextcloud-redis'],
    volumes: ['nextcloud_data', 'nextcloud_db_data', 'nextcloud_custom_apps'],
    bindMounts: ['/etc/ssl/certs/nextcloud.crt', '/srv/nextcloud/config'],
    labels: { 'backup': 'true', 'env': 'production', 'tier': '1' },
    isProtected: true,
    protectedByJobId: 'job-01',
    dbEngine: 'postgres',
    sizeBytes: 48318382080, // ~45 GB
    status: 'running',
  },
  {
    id: 'wl-02',
    serverId: 'srv-01',
    serverName: 'prod-docker-01.us-east.corp',
    type: 'container',
    name: 'postgres-analytics-primary',
    containers: ['postgres-analytics-primary'],
    volumes: ['pgdata_analytics'],
    bindMounts: ['/srv/postgres/postgresql.conf'],
    labels: { 'backup': 'true', 'env': 'production', 'db': 'postgres' },
    isProtected: true,
    protectedByJobId: 'job-01',
    dbEngine: 'postgres',
    sizeBytes: 34359738368, // ~32 GB
    status: 'running',
  },
  {
    id: 'wl-03',
    serverId: 'srv-02',
    serverName: 'prod-docker-02.eu-west.corp',
    type: 'compose_stack',
    name: 'gitlab-ce-enterprise',
    composeProject: 'gitlab',
    containers: ['gitlab-web', 'gitlab-runner-01', 'gitlab-postgresql'],
    volumes: ['gitlab_data', 'gitlab_db_data', 'gitlab_logs'],
    bindMounts: ['/srv/gitlab/config'],
    labels: { 'backup': 'true', 'tier': '1' },
    isProtected: true,
    protectedByJobId: 'job-02',
    dbEngine: 'postgres',
    sizeBytes: 85899345920, // ~80 GB
    status: 'running',
  },
  {
    id: 'wl-04',
    serverId: 'srv-02',
    serverName: 'prod-docker-02.eu-west.corp',
    type: 'container',
    name: 'mongo-logs-warehouse',
    containers: ['mongo-logs-warehouse'],
    volumes: ['mongodata_db'],
    bindMounts: [],
    labels: { 'backup': 'true', 'db': 'mongo' },
    isProtected: true,
    protectedByJobId: 'job-03',
    dbEngine: 'mongo',
    sizeBytes: 25769803776, // ~24 GB
    status: 'running',
  },
  {
    id: 'wl-05',
    serverId: 'srv-01',
    serverName: 'prod-docker-01.us-east.corp',
    type: 'container',
    name: 'traefik-edge-ingress',
    containers: ['traefik-edge-ingress'],
    volumes: ['traefik_acme_storage'],
    bindMounts: ['/var/run/docker.sock', '/etc/traefik/traefik.yml'],
    labels: { 'infra': 'ingress' },
    isProtected: false,
    dbEngine: 'none',
    sizeBytes: 524288000, // 500 MB
    status: 'running',
  },
  {
    id: 'wl-06',
    serverId: 'srv-03',
    serverName: 'staging-docker-03.us-east.corp',
    type: 'compose_stack',
    name: 'ecommerce-staging-api',
    composeProject: 'ecom-staging',
    containers: ['api-gateway', 'payment-mock', 'redis-cache'],
    volumes: ['ecom_staging_cache'],
    bindMounts: [],
    labels: { 'env': 'staging' },
    isProtected: false,
    dbEngine: 'redis',
    sizeBytes: 2147483648, // 2 GB
    status: 'running',
  },
];

const INITIAL_JOBS: BackupJob[] = [
  {
    id: 'job-01',
    name: 'Daily Nextcloud & DBs (GFS Immutable)',
    description: 'Production Nextcloud Compose stack + PostgreSQL app-aware consistent dump with GFS retention and 14d immutability.',
    workloadIds: ['wl-01', 'wl-02'],
    repositoryId: 'repo-01',
    backupMode: 'forever_forward',
    retentionPoints: 14,
    gfsPolicy: {
      weeklyCount: 4,
      monthlyCount: 12,
      yearlyCount: 3,
    },
    immutabilityDays: 14,
    guestProcessing: {
      enabled: true,
      dbEngine: 'postgres',
      quiesceStrategy: 'app_aware',
      dbUser: 'postgres',
      preFreezeScript: 'pg_dumpall -U postgres -f /var/tmp/consistent_dump.sql',
      postThawScript: 'rm -f /var/tmp/consistent_dump.sql',
      failOnError: true,
    },
    schedule: {
      enabled: true,
      frequency: 'daily',
      cronExpression: '0 2 * * *',
      time: '02:00 UTC',
      retryCount: 3,
      retryDelayMinutes: 10,
      missedRunPolicy: 'run_immediately',
    },
    compressionLevel: 'optimal',
    encryptionEnabled: true,
    status: 'success',
    lastRunAt: '2026-10-25 02:00:12',
    nextRunAt: '2026-10-26 02:00:00',
    lastDurationSec: 418,
    lastTransferredBytes: 4214828100, // ~4.2 GB incremental
    lastResult: 'success',
    recentRuns: ['success', 'success', 'success', 'success', 'warning', 'success', 'success', 'success', 'success', 'success'],
  },
  {
    id: 'job-02',
    name: 'GitLab Enterprise Stack Daily',
    description: 'Complete GitLab Compose stack with repositories, artifacts, and PostgreSQL logical backup.',
    workloadIds: ['wl-03'],
    repositoryId: 'repo-01',
    backupMode: 'forward_incremental',
    retentionPoints: 7,
    gfsPolicy: {
      weeklyCount: 2,
      monthlyCount: 6,
      yearlyCount: 0,
    },
    immutabilityDays: 7,
    guestProcessing: {
      enabled: true,
      dbEngine: 'postgres',
      quiesceStrategy: 'app_aware',
      failOnError: true,
    },
    schedule: {
      enabled: true,
      frequency: 'daily',
      cronExpression: '0 3 * * *',
      time: '03:00 UTC',
      retryCount: 2,
      retryDelayMinutes: 15,
      missedRunPolicy: 'run_immediately',
    },
    compressionLevel: 'high',
    encryptionEnabled: true,
    status: 'success',
    lastRunAt: '2026-10-25 03:00:08',
    nextRunAt: '2026-10-26 03:00:00',
    lastDurationSec: 624,
    lastTransferredBytes: 6815744000,
    lastResult: 'success',
    recentRuns: ['success', 'success', 'warning', 'success', 'success', 'success', 'success'],
  },
  {
    id: 'job-03',
    name: 'Mongo Logs Warehouse Backup',
    description: 'MongoDB collection archives with mongodump / fsyncLock quiesce.',
    workloadIds: ['wl-04'],
    repositoryId: 'repo-02',
    backupMode: 'forever_forward',
    retentionPoints: 10,
    gfsPolicy: {
      weeklyCount: 2,
      monthlyCount: 4,
      yearlyCount: 0,
    },
    immutabilityDays: 0,
    guestProcessing: {
      enabled: true,
      dbEngine: 'mongo',
      quiesceStrategy: 'app_aware',
      failOnError: false,
    },
    schedule: {
      enabled: true,
      frequency: 'daily',
      cronExpression: '0 4 * * *',
      time: '04:00 UTC',
      runAfterJobId: 'job-02',
      retryCount: 1,
      retryDelayMinutes: 5,
      missedRunPolicy: 'skip',
    },
    compressionLevel: 'optimal',
    encryptionEnabled: false,
    status: 'idle',
    lastRunAt: '2026-10-25 04:12:00',
    nextRunAt: '2026-10-26 04:00:00',
    lastDurationSec: 312,
    lastTransferredBytes: 3410291000,
    lastResult: 'success',
    recentRuns: ['success', 'failed', 'success', 'success', 'success'],
  },
];

const INITIAL_COPY_JOBS: BackupCopyJob[] = [
  {
    id: 'copy-01',
    name: '3-2-1 Copy: Nextcloud to NFS Secondary Vault',
    sourceJobId: 'job-01',
    sourceRepoId: 'repo-01',
    targetRepoId: 'repo-02',
    mode: 'immediate',
    bandwidthLimitMBs: 100,
    retentionPoints: 30,
    gfsEnabled: true,
    status: 'idle',
    lastRunAt: '2026-10-25 02:45:00',
    copyLagMinutes: 12,
  },
  {
    id: 'copy-02',
    name: 'Offsite Cloud Replicate to S3 Immutable',
    sourceJobId: 'job-01',
    sourceRepoId: 'repo-01',
    targetRepoId: 'repo-03',
    mode: 'periodic',
    bandwidthLimitMBs: 50,
    retentionPoints: 90,
    gfsEnabled: true,
    status: 'idle',
    lastRunAt: '2026-10-25 04:00:00',
    copyLagMinutes: 65,
  },
];

// Guest files fixture for Guest File Restore (file tree inside volume)
const NEXTCLOUD_GUEST_FILES: GuestFileItem[] = [
  {
    id: 'gf-01',
    name: 'config',
    path: '/config',
    isDirectory: true,
    sizeBytes: 16384,
    modifiedAt: '2026-10-24 18:22:00',
    permissions: 'drwxr-xr-x',
    children: [
      {
        id: 'gf-01-1',
        name: 'config.php',
        path: '/config/config.php',
        isDirectory: false,
        sizeBytes: 4096,
        modifiedAt: '2026-10-24 18:22:00',
        permissions: '-rw-r-----',
      },
      {
        id: 'gf-01-2',
        name: 'autoconfig.php',
        path: '/config/autoconfig.php',
        isDirectory: false,
        sizeBytes: 1280,
        modifiedAt: '2026-08-10 11:00:00',
        permissions: '-rw-r--r--',
      },
    ],
  },
  {
    id: 'gf-02',
    name: 'data',
    path: '/data',
    isDirectory: true,
    sizeBytes: 42949672960,
    modifiedAt: '2026-10-25 01:50:00',
    permissions: 'drwxr-x---',
    children: [
      {
        id: 'gf-02-1',
        name: 'admin',
        path: '/data/admin',
        isDirectory: true,
        sizeBytes: 21474836480,
        modifiedAt: '2026-10-25 01:45:00',
        permissions: 'drwxr-xr-x',
        children: [
          {
            id: 'gf-02-1-1',
            name: 'Q3_Financial_Audit_Report.pdf',
            path: '/data/admin/files/Q3_Financial_Audit_Report.pdf',
            isDirectory: false,
            sizeBytes: 18452900,
            modifiedAt: '2026-10-22 14:10:00',
            permissions: '-rw-r--r--',
          },
          {
            id: 'gf-02-1-2',
            name: 'Infrastructure_Inventory_2026.xlsx',
            path: '/data/admin/files/Infrastructure_Inventory_2026.xlsx',
            isDirectory: false,
            sizeBytes: 5242880,
            modifiedAt: '2026-10-24 09:30:00',
            permissions: '-rw-r--r--',
          },
        ],
      },
      {
        id: 'gf-02-2',
        name: 'nextcloud.log',
        path: '/data/nextcloud.log',
        isDirectory: false,
        sizeBytes: 12458900,
        modifiedAt: '2026-10-25 01:59:00',
        permissions: '-rw-r-----',
      },
    ],
  },
  {
    id: 'gf-03',
    name: 'db_dumps',
    path: '/db_dumps',
    isDirectory: true,
    sizeBytes: 5368709120,
    modifiedAt: '2026-10-25 02:05:00',
    permissions: 'drwx------',
    children: [
      {
        id: 'gf-03-1',
        name: 'nextcloud_app_aware_pgdump.sql.zst',
        path: '/db_dumps/nextcloud_app_aware_pgdump.sql.zst',
        isDirectory: false,
        sizeBytes: 4215809120,
        modifiedAt: '2026-10-25 02:04:15',
        permissions: '-rw-------',
      },
    ],
  },
];

const INITIAL_RESTORE_POINTS: RestorePoint[] = [
  {
    id: 'rp-01',
    jobId: 'job-01',
    jobName: 'Daily Nextcloud & DBs (GFS Immutable)',
    workloadId: 'wl-01',
    workloadName: 'nextcloud-production',
    repositoryId: 'repo-01',
    timestamp: '2026-10-25 02:00:12',
    type: 'incremental',
    sizeBytes: 4214828100,
    dataTransferredBytes: 4214828100,
    dedupeRatio: 2.3,
    compressionRatio: 2.1,
    checksumSha256: '7f9a2b8e3c1d4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f',
    isVerified: true,
    verificationPassed: true,
    immutabilityUntil: '2026-11-08 02:00:12',
    gfsFlag: null,
    artifacts: [
      {
        id: 'art-01',
        name: 'nextcloud_data.tar.zst.inc',
        type: 'volume_archive',
        sizeBytes: 3120000000,
        checksumSha256: '4f2d7a8b...c91e',
        compressionRatio: 2.2,
      },
      {
        id: 'art-02',
        name: 'nextcloud_postgres_dump.sql.zst',
        type: 'db_dump',
        sizeBytes: 1094828100,
        checksumSha256: '9a8b7c6d...e5f4',
        compressionRatio: 3.4,
      },
      {
        id: 'art-03',
        name: 'docker-compose.manifest.json',
        type: 'compose_manifest',
        sizeBytes: 42000,
        checksumSha256: '1a2b3c4d...5e6f',
        compressionRatio: 1.0,
      },
    ],
    guestFiles: NEXTCLOUD_GUEST_FILES,
    metadata: {
      composeYaml: `version: '3.8'\nservices:\n  app:\n    image: nextcloud:29-apache\n    restart: always\n    ports:\n      - 8080:80\n    volumes:\n      - nextcloud_data:/var/www/html\n  db:\n    image: postgres:16-alpine\n    volumes:\n      - nextcloud_db_data:/var/lib/postgresql/data`,
      ports: ['8080:80'],
      volumes: ['nextcloud_data', 'nextcloud_db_data'],
    },
  },
  {
    id: 'rp-02',
    jobId: 'job-01',
    jobName: 'Daily Nextcloud & DBs (GFS Immutable)',
    workloadId: 'wl-01',
    workloadName: 'nextcloud-production',
    repositoryId: 'repo-01',
    timestamp: '2026-10-24 02:00:05',
    type: 'incremental',
    sizeBytes: 3950000000,
    dataTransferredBytes: 3950000000,
    dedupeRatio: 2.4,
    compressionRatio: 2.1,
    checksumSha256: '8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b',
    isVerified: true,
    verificationPassed: true,
    immutabilityUntil: '2026-11-07 02:00:05',
    gfsFlag: null,
    artifacts: [],
    guestFiles: NEXTCLOUD_GUEST_FILES,
    metadata: {},
  },
  {
    id: 'rp-03',
    jobId: 'job-01',
    jobName: 'Daily Nextcloud & DBs (GFS Immutable)',
    workloadId: 'wl-01',
    workloadName: 'nextcloud-production',
    repositoryId: 'repo-01',
    timestamp: '2026-10-18 02:00:00',
    type: 'synthetic_full',
    sizeBytes: 44100000000,
    dataTransferredBytes: 1200000000,
    dedupeRatio: 3.1,
    compressionRatio: 2.4,
    checksumSha256: '3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b',
    isVerified: true,
    verificationPassed: true,
    immutabilityUntil: '2026-11-01 02:00:00',
    gfsFlag: 'W',
    artifacts: [],
    guestFiles: NEXTCLOUD_GUEST_FILES,
    metadata: {},
  },
  {
    id: 'rp-04',
    jobId: 'job-01',
    jobName: 'Daily Nextcloud & DBs (GFS Immutable)',
    workloadId: 'wl-01',
    workloadName: 'nextcloud-production',
    repositoryId: 'repo-01',
    timestamp: '2026-09-30 02:00:00',
    type: 'full',
    sizeBytes: 42500000000,
    dataTransferredBytes: 42500000000,
    dedupeRatio: 2.8,
    compressionRatio: 2.3,
    checksumSha256: '0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    isVerified: true,
    verificationPassed: true,
    immutabilityUntil: '2026-12-30 02:00:00',
    gfsFlag: 'M',
    artifacts: [],
    guestFiles: NEXTCLOUD_GUEST_FILES,
    metadata: {},
  },
  {
    id: 'rp-05',
    jobId: 'job-02',
    jobName: 'GitLab Enterprise Stack Daily',
    workloadId: 'wl-03',
    workloadName: 'gitlab-ce-enterprise',
    repositoryId: 'repo-01',
    timestamp: '2026-10-25 03:00:08',
    type: 'incremental',
    sizeBytes: 6815744000,
    dataTransferredBytes: 6815744000,
    dedupeRatio: 2.0,
    compressionRatio: 2.6,
    checksumSha256: '2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e',
    isVerified: true,
    verificationPassed: true,
    immutabilityUntil: '2026-11-01 03:00:08',
    gfsFlag: null,
    artifacts: [],
    guestFiles: [],
    metadata: {},
  },
];

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alm-01',
    severity: 'warning',
    title: 'Repository Low Free Space Alert',
    message: 'NFS-Secondary-Vault-Archive free space has dipped below 30% threshold (11.2 TB of 16 TB available). Capacity forecast suggests 42 days until full.',
    source: 'repo-02',
    timestamp: '2026-10-25 21:00:00',
    acknowledged: false,
  },
  {
    id: 'alm-02',
    severity: 'warning',
    title: 'Unprotected Workloads Discovered',
    message: '2 active Docker workloads (traefik-edge-ingress, ecommerce-staging-api) have no assigned backup jobs and violate corporate RPO (24h).',
    source: 'inventory-discovery',
    timestamp: '2026-10-25 20:30:00',
    acknowledged: false,
  },
];

const INITIAL_SESSIONS: JobSession[] = [
  {
    id: 'sess-01',
    jobId: 'job-01',
    jobName: 'Daily Nextcloud & DBs (GFS Immutable)',
    type: 'backup',
    status: 'success',
    startTime: '2026-10-25 02:00:12',
    endTime: '2026-10-25 02:07:10',
    durationSec: 418,
    progressPct: 100,
    currentWorkload: 'Completed',
    processingRateMBs: 112.4,
    bottleneck: {
      sourcePct: 24,
      proxyPct: 14,
      networkPct: 18,
      targetPct: 44, // Target repository was the bottleneck
    },
    transferredBytes: 4214828100,
    totalBytes: 82678120448,
    dedupeRatio: 2.3,
    compressionRatio: 2.1,
    logs: [
      { id: 'l-1', timestamp: '02:00:12', level: 'info', phase: 'queued', message: 'Job session queued by Celery Beat scheduler.' },
      { id: 'l-2', timestamp: '02:00:13', level: 'info', phase: 'scheduling', message: 'Resource scheduler allocated task slot on Proxy "Default Backup Proxy (Controller)".' },
      { id: 'l-3', timestamp: '02:00:14', level: 'info', phase: 'preflight', message: 'SSH connection established with 10.240.10.15:22. TOFU host fingerprint verified.' },
      { id: 'l-4', timestamp: '02:00:15', level: 'info', phase: 'preflight', message: 'Remote Docker daemon 27.2.0 responsive. Helper image cr.corp.internal/backup/helper:v2.4 cached.' },
      { id: 'l-5', timestamp: '02:00:18', level: 'info', phase: 'guest_processing', message: 'Starting application-aware guest processing for workload "nextcloud-production".' },
      { id: 'l-6', timestamp: '02:00:20', level: 'info', phase: 'guest_processing', message: 'Executing PostgreSQL quiesce & pg_dumpall inside container "nextcloud-db-postgres"...' },
      { id: 'l-7', timestamp: '02:01:45', level: 'success', phase: 'guest_processing', message: 'DB dump completed. 1.09 GB logical SQL stream captured cleanly.' },
      { id: 'l-8', timestamp: '02:01:46', level: 'info', phase: 'transfer', message: 'Attaching helper container to volumes [nextcloud_data, nextcloud_db_data] (read-only).' },
      { id: 'l-9', timestamp: '02:01:48', level: 'info', phase: 'transfer', message: 'Streaming volume data over SSH via tar --listed-incremental | zstd -3 to proxy worker.' },
      { id: 'l-10', timestamp: '02:06:12', level: 'success', phase: 'transfer', message: 'Data transfer complete. 4.21 GB transferred at 112.4 MB/s.' },
      { id: 'l-11', timestamp: '02:06:15', level: 'info', phase: 'finalizing', message: 'Cleaning up helper containers and remote temporary mount artifacts on host.' },
      { id: 'l-12', timestamp: '02:06:22', level: 'info', phase: 'finalizing', message: 'Applying GFS retention & Immutability lock until 2026-11-08 (14 days).' },
      { id: 'l-13', timestamp: '02:06:30', level: 'info', phase: 'verification', message: 'Calculating SHA-256 block checksums and cataloging restore point manifest.' },
      { id: 'l-14', timestamp: '02:07:10', level: 'success', phase: 'completed', message: 'Backup completed successfully. Bottleneck: Target (44%).' },
    ],
  },
];

const INITIAL_SUREBACKUP: SureBackupJob[] = [
  {
    id: 'sb-01',
    name: 'SureBackup: Nextcloud Recovery Verification',
    backupJobId: 'job-01',
    targetServerId: 'srv-03',
    isolatedNetworkName: 'surebackup_net_isolated_491',
    autoTearDown: true,
    testScript: 'docker exec $CONTAINER_ID curl -f http://localhost:80/status.php && docker exec $CONTAINER_ID_DB psql -U postgres -c "SELECT 1;"',
    healthCheckPort: 8080,
    healthCheckEndpoint: '/status.php',
    status: 'idle',
    lastRunAt: '2026-10-25 04:30:00',
    lastResult: 'passed',
  },
];

const INITIAL_INSTANT_RECOVERY: InstantRecoverySession[] = [];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-01',
    timestamp: '2026-10-25 22:45:10',
    user: 'admin',
    role: 'admin',
    action: 'SERVER_COMPONENT_CHECK',
    target: 'prod-docker-01.us-east.corp',
    details: 'Triggered manual component check; verified SSH, Docker 27.2.0, zstd and free space.',
    ipAddress: '10.240.1.50',
  },
  {
    id: 'aud-02',
    timestamp: '2026-10-25 21:30:00',
    user: 'admin',
    role: 'admin',
    action: 'REPOSITORY_RESCAN',
    target: 'Default NVMe Backup Repository',
    details: 'Rescanned storage extents. 5 restore points verified.',
    ipAddress: '10.240.1.50',
  },
  {
    id: 'aud-03',
    timestamp: '2026-10-25 02:00:12',
    user: 'system/celery-beat',
    role: 'operator',
    action: 'JOB_RUN_STARTED',
    target: 'Daily Nextcloud & DBs (GFS Immutable)',
    details: 'Scheduled backup job started automatically.',
    ipAddress: '127.0.0.1',
  },
];

const INITIAL_USER: UserAccount = {
  id: 'usr-01',
  username: 'admin',
  fullName: 'Backup Administrator',
  role: 'admin',
  mfaEnabled: true,
};

class VeeamStore {
  private servers: ManagedServer[] = INITIAL_SERVERS;
  private credentials: Credential[] = INITIAL_CREDENTIALS;
  private proxies: BackupProxy[] = INITIAL_PROXIES;
  private repositories: BackupRepository[] = INITIAL_REPOSITORIES;
  private scaleOut: ScaleOutRepository[] = INITIAL_SCALE_OUT;
  private workloads: Workload[] = INITIAL_WORKLOADS;
  private jobs: BackupJob[] = INITIAL_JOBS;
  private copyJobs: BackupCopyJob[] = INITIAL_COPY_JOBS;
  private restorePoints: RestorePoint[] = INITIAL_RESTORE_POINTS;
  private sessions: JobSession[] = INITIAL_SESSIONS;
  private sureBackupJobs: SureBackupJob[] = INITIAL_SUREBACKUP;
  private instantRecoverySessions: InstantRecoverySession[] = INITIAL_INSTANT_RECOVERY;
  private alarms: Alarm[] = INITIAL_ALARMS;
  private auditLogs: AuditLogEntry[] = INITIAL_AUDIT_LOGS;
  private currentUser: UserAccount = INITIAL_USER;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      const state = {
        servers: this.servers,
        credentials: this.credentials,
        proxies: this.proxies,
        repositories: this.repositories,
        scaleOut: this.scaleOut,
        workloads: this.workloads,
        jobs: this.jobs,
        copyJobs: this.copyJobs,
        restorePoints: this.restorePoints,
        sessions: this.sessions,
        sureBackupJobs: this.sureBackupJobs,
        instantRecoverySessions: this.instantRecoverySessions,
        alarms: this.alarms,
        auditLogs: this.auditLogs,
      };
      localStorage.setItem('veeam_docker_backup_state', JSON.stringify(state));
    } catch {
      // ignore
    }
    this.notify();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem('veeam_docker_backup_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.servers) this.servers = parsed.servers;
        if (parsed.credentials) this.credentials = parsed.credentials;
        if (parsed.proxies) this.proxies = parsed.proxies;
        if (parsed.repositories) this.repositories = parsed.repositories;
        if (parsed.scaleOut) this.scaleOut = parsed.scaleOut;
        if (parsed.workloads) this.workloads = parsed.workloads;
        if (parsed.jobs) this.jobs = parsed.jobs;
        if (parsed.copyJobs) this.copyJobs = parsed.copyJobs;
        if (parsed.restorePoints) this.restorePoints = parsed.restorePoints;
        if (parsed.sessions) this.sessions = parsed.sessions;
        if (parsed.sureBackupJobs) this.sureBackupJobs = parsed.sureBackupJobs;
        if (parsed.instantRecoverySessions) this.instantRecoverySessions = parsed.instantRecoverySessions;
        if (parsed.alarms) this.alarms = parsed.alarms;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
      }
    } catch {
      // ignore
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Getters
  getServers() { return this.servers; }
  getCredentials() { return this.credentials; }
  getProxies() { return this.proxies; }
  getRepositories() { return this.repositories; }
  getScaleOut() { return this.scaleOut; }
  getWorkloads() { return this.workloads; }
  getJobs() { return this.jobs; }
  getCopyJobs() { return this.copyJobs; }
  getRestorePoints() { return this.restorePoints; }
  getSessions() { return this.sessions; }
  getSureBackupJobs() { return this.sureBackupJobs; }
  getInstantRecoverySessions() { return this.instantRecoverySessions; }
  getAlarms() { return this.alarms; }
  getAuditLogs() { return this.auditLogs; }
  getCurrentUser() { return this.currentUser; }

  setCurrentUserRole(role: UserAccount['role']) {
    this.currentUser = { ...this.currentUser, role };
    this.notify();
  }

  addAuditLog(action: string, target: string, details: string) {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: this.currentUser.username,
      role: this.currentUser.role,
      action,
      target,
      details,
      ipAddress: '10.240.1.50',
    };
    this.auditLogs = [entry, ...this.auditLogs];
    this.saveToStorage();
  }

  // Add Managed Server
  addServer(server: Omit<ManagedServer, 'id' | 'status' | 'dockerVersion' | 'helperImage' | 'zstdAvailable' | 'tarAvailable' | 'freeSpaceGB' | 'totalSpaceGB' | 'lastCheckedAt' | 'osInfo'>) {
    const newServer: ManagedServer = {
      ...server,
      id: `srv-${Date.now()}`,
      status: 'online',
      dockerVersion: '27.2.0 (API 1.47)',
      helperImage: 'cr.corp.internal/backup/helper:v2.4',
      zstdAvailable: true,
      tarAvailable: true,
      freeSpaceGB: 450,
      totalSpaceGB: 1000,
      lastCheckedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      osInfo: 'Linux 6.8.0-generic (Docker Host)',
    };
    this.servers = [...this.servers, newServer];
    this.addAuditLog('SERVER_ADD', newServer.name, `Added managed server ${newServer.host}:${newServer.sshPort}`);
    this.saveToStorage();
    return newServer;
  }

  // Rescan / Component check
  runComponentCheck(serverId: string) {
    const srv = this.servers.find(s => s.id === serverId);
    if (!srv) return;
    srv.lastCheckedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    srv.status = 'online';
    this.addAuditLog('SERVER_COMPONENT_CHECK', srv.name, 'SSH probe, Docker CLI, helper image and zstd validated.');
    this.saveToStorage();
  }

  // Add Credential
  addCredential(cred: Omit<Credential, 'id' | 'lastUsedAt'>) {
    const newCred: Credential = {
      ...cred,
      id: `cred-${Date.now()}`,
      lastUsedAt: 'Never',
    };
    this.credentials = [...this.credentials, newCred];
    this.addAuditLog('CREDENTIAL_CREATE', newCred.name, `Encrypted credential created for user ${newCred.username}`);
    this.saveToStorage();
    return newCred;
  }

  // Add Repository
  addRepository(repo: Omit<BackupRepository, 'id' | 'freeGB' | 'activeTasks' | 'isScaleOutExtent' | 'maintenanceMode' | 'lastRescanAt'>) {
    const newRepo: BackupRepository = {
      ...repo,
      id: `repo-${Date.now()}`,
      freeGB: Math.round(repo.capacityGB * 0.85),
      activeTasks: 0,
      isScaleOutExtent: false,
      maintenanceMode: false,
      lastRescanAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.repositories = [...this.repositories, newRepo];
    this.addAuditLog('REPOSITORY_ADD', newRepo.name, `Repository created at ${newRepo.path} (${newRepo.capacityGB} GB)`);
    this.saveToStorage();
    return newRepo;
  }

  // Add Backup Job
  addJob(job: Omit<BackupJob, 'id' | 'status' | 'lastRunAt' | 'nextRunAt' | 'lastDurationSec' | 'lastTransferredBytes' | 'lastResult' | 'recentRuns'>) {
    const newJob: BackupJob = {
      ...job,
      id: `job-${Date.now()}`,
      status: 'idle',
      lastRunAt: null,
      nextRunAt: '2026-10-26 ' + (job.schedule.time || '02:00 UTC'),
      lastDurationSec: 0,
      lastTransferredBytes: 0,
      lastResult: null,
      recentRuns: [],
    };
    this.jobs = [...this.jobs, newJob];
    // mark workloads as protected
    this.workloads = this.workloads.map(wl => {
      if (job.workloadIds.includes(wl.id)) {
        return { ...wl, isProtected: true, protectedByJobId: newJob.id };
      }
      return wl;
    });
    this.addAuditLog('JOB_CREATE', newJob.name, `Backup job configured for ${newJob.workloadIds.length} workloads`);
    this.saveToStorage();
    return newJob;
  }

  // Add Backup Copy Job
  addCopyJob(job: Omit<BackupCopyJob, 'id' | 'status' | 'lastRunAt' | 'copyLagMinutes'>) {
    const newCopy: BackupCopyJob = {
      ...job,
      id: `copy-${Date.now()}`,
      status: 'idle',
      lastRunAt: null,
      copyLagMinutes: 0,
    };
    this.copyJobs = [...this.copyJobs, newCopy];
    this.addAuditLog('COPY_JOB_CREATE', newCopy.name, `Backup copy job created for secondary repo`);
    this.saveToStorage();
    return newCopy;
  }

  // Toggle Job Disabled/Enabled
  toggleJobDisabled(jobId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;
    if (job.status === 'disabled') {
      job.status = 'idle';
      this.addAuditLog('JOB_ENABLE', job.name, 'Job schedule enabled');
    } else {
      job.status = 'disabled';
      this.addAuditLog('JOB_DISABLE', job.name, 'Job schedule disabled');
    }
    this.saveToStorage();
  }

  // Start Backup Job with Live Step Execution
  startJob(jobId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job || job.status === 'running') return;

    job.status = 'running';
    const sessionId = `sess-${Date.now()}`;
    const startTimeStr = new Date().toISOString().replace('T', ' ').substring(11, 19);

    const session: JobSession = {
      id: sessionId,
      jobId: job.id,
      jobName: job.name,
      type: 'backup',
      status: 'running',
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      endTime: null,
      durationSec: 0,
      progressPct: 5,
      currentWorkload: 'Initializing',
      processingRateMBs: 0,
      bottleneck: {
        sourcePct: 30,
        proxyPct: 15,
        networkPct: 20,
        targetPct: 35,
      },
      transferredBytes: 0,
      totalBytes: 45000000000,
      dedupeRatio: 2.2,
      compressionRatio: 2.1,
      logs: [
        {
          id: `l-${Date.now()}-1`,
          timestamp: startTimeStr,
          level: 'info',
          phase: 'queued',
          message: `Backup job "${job.name}" initiated by operator.`,
        },
      ],
    };

    this.sessions = [session, ...this.sessions];
    this.addAuditLog('JOB_START', job.name, `Manual job run triggered (Session ${sessionId})`);
    this.saveToStorage();

    // Execute phases sequentially to simulate the real Veeam worker pipeline
    this.simulateJobExecution(job, session);
  }

  private simulateJobExecution(job: BackupJob, session: JobSession) {
    const phases: {
      delay: number;
      pct: number;
      workload: string;
      rate: number;
      phase: SessionLogLine['phase'];
      level: SessionLogLine['level'];
      message: string;
      transferred: number;
    }[] = [
      {
        delay: 1000,
        pct: 12,
        workload: 'Resource Scheduling',
        rate: 0,
        phase: 'scheduling',
        level: 'info',
        message: 'Proxy slot allocated on "Default Backup Proxy (Controller)". Target repo slot reserved.',
        transferred: 0,
      },
      {
        delay: 2200,
        pct: 25,
        workload: 'SSH Preflight & Handshake',
        rate: 0,
        phase: 'preflight',
        level: 'info',
        message: 'Remote host SSH handshake OK. Docker API responsive. Helper container verified.',
        transferred: 0,
      },
      {
        delay: 3800,
        pct: 42,
        workload: 'App-Aware DB Processing',
        rate: 65.4,
        phase: 'guest_processing',
        level: 'info',
        message: 'Executing app-aware quiesce for PostgreSQL / MySQL containers. Capturing consistent logical dump stream.',
        transferred: 1048576000,
      },
      {
        delay: 5500,
        pct: 70,
        workload: 'Streaming Volume Data',
        rate: 118.2,
        phase: 'transfer',
        level: 'info',
        message: 'Streaming tar --listed-incremental | zstd over encrypted SSH stream. Deduplication active.',
        transferred: 3200000000,
      },
      {
        delay: 7200,
        pct: 88,
        workload: 'Finalizing & Synthetic Merge',
        rate: 95.0,
        phase: 'finalizing',
        level: 'info',
        message: 'Removing remote temporary read-only helper container. Applying GFS & Immutability lock.',
        transferred: 4210000000,
      },
      {
        delay: 8800,
        pct: 96,
        workload: 'Integrity Verification',
        rate: 0,
        phase: 'verification',
        level: 'info',
        message: 'Validating SHA-256 block checksums and updating repository catalog index.',
        transferred: 4210000000,
      },
      {
        delay: 10000,
        pct: 100,
        workload: 'Completed',
        rate: 112.5,
        phase: 'completed',
        level: 'success',
        message: 'Backup completed successfully. New restore point registered in catalog. Bottleneck: Target (42%).',
        transferred: 4214828100,
      },
    ];

    phases.forEach(step => {
      setTimeout(() => {
        const currentSession = this.sessions.find(s => s.id === session.id);
        const currentJob = this.jobs.find(j => j.id === job.id);
        if (!currentSession || currentSession.status === 'cancelled') return;

        currentSession.progressPct = step.pct;
        currentSession.currentWorkload = step.workload;
        currentSession.processingRateMBs = step.rate;
        currentSession.transferredBytes = step.transferred;
        currentSession.durationSec += Math.round(step.delay / 1000);

        const timeStr = new Date().toISOString().replace('T', ' ').substring(11, 19);
        currentSession.logs.push({
          id: `l-${Date.now()}-${Math.random()}`,
          timestamp: timeStr,
          level: step.level,
          phase: step.phase,
          message: step.message,
        });

        if (step.pct === 100) {
          currentSession.status = 'success';
          currentSession.endTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

          if (currentJob) {
            currentJob.status = 'success';
            currentJob.lastRunAt = currentSession.endTime;
            currentJob.lastDurationSec = currentSession.durationSec;
            currentJob.lastTransferredBytes = currentSession.transferredBytes;
            currentJob.lastResult = 'success';
            currentJob.recentRuns = ['success', ...currentJob.recentRuns.slice(0, 9)];
          }

          // Create new Restore Point in catalog
          const newRp: RestorePoint = {
            id: `rp-${Date.now()}`,
            jobId: job.id,
            jobName: job.name,
            workloadId: job.workloadIds[0] || 'wl-01',
            workloadName: this.workloads.find(w => w.id === job.workloadIds[0])?.name || 'workload',
            repositoryId: job.repositoryId,
            timestamp: currentSession.endTime,
            type: 'incremental',
            sizeBytes: currentSession.transferredBytes,
            dataTransferredBytes: currentSession.transferredBytes,
            dedupeRatio: 2.3,
            compressionRatio: 2.1,
            checksumSha256: '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
            isVerified: true,
            verificationPassed: true,
            immutabilityUntil: job.immutabilityDays > 0 ? new Date(Date.now() + job.immutabilityDays * 86400000).toISOString().replace('T', ' ').substring(0, 19) : null,
            gfsFlag: null,
            artifacts: [
              {
                id: `art-${Date.now()}-1`,
                name: 'incremental_volume_stream.tar.zst',
                type: 'volume_archive',
                sizeBytes: 3100000000,
                checksumSha256: 'a1b2c3d4...9988',
                compressionRatio: 2.1,
              },
              {
                id: `art-${Date.now()}-2`,
                name: 'app_aware_db_dump.sql.zst',
                type: 'db_dump',
                sizeBytes: 1114828100,
                checksumSha256: 'c3d4e5f6...7766',
                compressionRatio: 3.2,
              },
            ],
            guestFiles: NEXTCLOUD_GUEST_FILES,
            metadata: {
              ports: ['8080:80'],
              volumes: ['app_data', 'db_data'],
            },
          };

          this.restorePoints = [newRp, ...this.restorePoints];
          this.addAuditLog('RESTORE_POINT_CREATED', newRp.workloadName, `Point-in-time restore point generated (${Math.round(newRp.sizeBytes / 1e9 * 10) / 10} GB)`);
        }

        this.saveToStorage();
      }, step.delay);
    });
  }

  // Stop Running Job
  stopJob(jobId: string) {
    const job = this.jobs.find(j => j.id === jobId);
    const session = this.sessions.find(s => s.jobId === jobId && s.status === 'running');
    if (job) job.status = 'idle';
    if (session) {
      session.status = 'cancelled';
      session.endTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      session.logs.push({
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(11, 19),
        level: 'warn',
        phase: 'completed',
        message: 'Job cancelled by operator. Rolling back remote helper containers and partial chunks.',
      });
      this.addAuditLog('JOB_STOP', job ? job.name : jobId, 'Operator terminated running session');
    }
    this.saveToStorage();
  }

  // Delete Restore Point (Enforces Immutability!)
  deleteRestorePoint(rpId: string): { success: boolean; message: string } {
    const rp = this.restorePoints.find(r => r.id === rpId);
    if (!rp) return { success: false, message: 'Restore point not found' };

    if (rp.immutabilityUntil) {
      const lockDate = new Date(rp.immutabilityUntil);
      if (lockDate > new Date()) {
        return {
          success: false,
          message: `IMMUTABILITY VIOLATION: This restore point is locked under WORM compliance until ${rp.immutabilityUntil}. Deletion rejected by storage policy.`,
        };
      }
    }

    this.restorePoints = this.restorePoints.filter(r => r.id !== rpId);
    this.addAuditLog('RESTORE_POINT_DELETE', rp.workloadName, `Deleted restore point ${rp.timestamp}`);
    this.saveToStorage();
    return { success: true, message: 'Restore point deleted successfully.' };
  }

  // Instant Recovery (starts container immediately from backup)
  startInstantRecovery(rpId: string, targetServerId: string, tempPort: number, containerName: string) {
    const rp = this.restorePoints.find(r => r.id === rpId);
    const srv = this.servers.find(s => s.id === targetServerId);
    if (!rp || !srv) return null;

    const session: InstantRecoverySession = {
      id: `ir-${Date.now()}`,
      restorePointId: rp.id,
      workloadName: rp.workloadName,
      targetServerId: srv.id,
      targetServerName: srv.name,
      tempContainerName: containerName || `instant-recovery-${rp.workloadName}`,
      publishedPort: tempPort || 9090,
      status: 'running',
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      uptimeSeconds: 0,
      memoryUsageMB: 480,
      cpuPct: 2.4,
    };

    this.instantRecoverySessions = [session, ...this.instantRecoverySessions];
    this.addAuditLog('INSTANT_RECOVERY_START', session.tempContainerName, `Launched Instant Recovery container on ${srv.name}:${session.publishedPort}`);
    this.saveToStorage();
    return session;
  }

  // Finalize Instant Recovery (permanently keep and migrate)
  finalizeInstantRecovery(sessionId: string) {
    const sess = this.instantRecoverySessions.find(s => s.id === sessionId);
    if (!sess) return;
    sess.status = 'finalized';
    this.addAuditLog('INSTANT_RECOVERY_FINALIZE', sess.tempContainerName, 'Instant Recovery promoted to permanent production workload.');
    this.saveToStorage();
  }

  // Discard Instant Recovery (tear down temporary container)
  discardInstantRecovery(sessionId: string) {
    const sess = this.instantRecoverySessions.find(s => s.id === sessionId);
    if (!sess) return;
    sess.status = 'discarded';
    this.addAuditLog('INSTANT_RECOVERY_DISCARD', sess.tempContainerName, 'Instant Recovery container destroyed and temporary volume storage purged.');
    this.saveToStorage();
  }

  // Run SureBackup Recovery Verification
  runSureBackup(jobId: string) {
    const job = this.sureBackupJobs.find(j => j.id === jobId);
    if (!job) return;
    job.status = 'running';

    const session: SureBackupSession = {
      id: `sb-sess-${Date.now()}`,
      jobId: job.id,
      jobName: job.name,
      status: 'running',
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      endTime: null,
      workloadTested: 'nextcloud-production',
      isolatedNetwork: job.isolatedNetworkName,
      checks: [
        { name: 'Create Isolated Docker Network', status: 'pending', details: `Network ${job.isolatedNetworkName} (172.28.0.0/16)` },
        { name: 'Restore Volumes to Sandbox', status: 'pending', details: 'Extracting volume snapshot to ephemeral scratch directory' },
        { name: 'Start Application Containers', status: 'pending', details: 'Starting sandbox nextcloud-app + postgres in isolated sandbox' },
        { name: 'Heartbeat & Port Check', status: 'pending', details: `Testing port ${job.healthCheckPort} responsiveness` },
        { name: 'HTTP Health Check Probe', status: 'pending', details: `GET ${job.healthCheckEndpoint} expected 200 OK` },
        { name: 'Database Query Integrity Probe', status: 'pending', details: 'Executing "SELECT 1" on postgres container' },
        { name: 'Automatic Sandbox Teardown', status: 'pending', details: 'Stopping test containers & pruning isolated bridge network' },
      ],
    };

    this.addAuditLog('SUREBACKUP_START', job.name, `Triggered automated recovery verification in isolated sandbox`);
    this.saveToStorage();

    // Step through the checks
    session.checks.forEach((chk, idx) => {
      setTimeout(() => {
        chk.status = 'passed';
        this.saveToStorage();

        if (idx === session.checks.length - 1) {
          session.status = 'passed';
          session.endTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
          job.status = 'idle';
          job.lastRunAt = session.endTime;
          job.lastResult = 'passed';
          this.addAuditLog('SUREBACKUP_PASSED', job.name, 'All recovery verification checks passed with 100% compliance.');
          this.saveToStorage();
        }
      }, (idx + 1) * 1200);
    });
  }

  // Trigger Backup Copy Job
  runCopyJob(copyJobId: string) {
    const job = this.copyJobs.find(j => j.id === copyJobId);
    if (!job || job.status === 'running') return;
    job.status = 'running';
    this.addAuditLog('COPY_JOB_START', job.name, 'Initiated 3-2-1 secondary repository copy sync');
    this.saveToStorage();

    setTimeout(() => {
      job.status = 'idle';
      job.lastRunAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      job.copyLagMinutes = 0;
      this.addAuditLog('COPY_JOB_COMPLETED', job.name, 'Restore points synchronized to secondary repository with zero lag');
      this.saveToStorage();
    }, 4000);
  }

  // Acknowledge Alarm
  acknowledgeAlarm(alarmId: string) {
    const alm = this.alarms.find(a => a.id === alarmId);
    if (alm) {
      alm.acknowledged = true;
      this.saveToStorage();
    }
  }

  // Clear or Dismiss Alarm
  dismissAlarm(alarmId: string) {
    this.alarms = this.alarms.filter(a => a.id !== alarmId);
    this.saveToStorage();
  }
}

export const veeamStore = new VeeamStore();
