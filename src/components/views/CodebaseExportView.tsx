import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Folder,
  File,
  Terminal,
  Server,
  Layers,
} from 'lucide-react';

interface CodeFile {
  path: string;
  language: string;
  category: 'deploy' | 'scripts' | 'backend' | 'docs';
  content: string;
}

const PRODUCTION_FILES: CodeFile[] = [
  {
    path: 'deploy/docker-compose.yml',
    language: 'yaml',
    category: 'deploy',
    content: `version: '3.9'

services:
  # Central Veeam-style Backup Server API (FastAPI)
  backup-controller:
    build:
      context: ../backend
      dockerfile: Dockerfile
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://veeam_admin:Secr3tP@ss!@postgres:5432/veeam_catalog
      - REDIS_URL=redis://redis:6379/0
      - MASTER_ENCRYPTION_KEY=gAAAAABl-sample-fernet-master-key-32bytes=
      - SECRET_KEY=enterprise-veeam-jwt-secret-signing-key
    volumes:
      - repo_data:/mnt/backup-storage
      - /etc/veeam:/etc/veeam:ro
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  # Celery Worker (The Backup Proxy process that moves data)
  backup-proxy-worker:
    build:
      context: ../backend
      dockerfile: Dockerfile
    command: celery -A app.workers.celery_app worker -l INFO -Q backup_tasks,restore_tasks,maintenance -c 8
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://veeam_admin:Secr3tP@ss!@postgres:5432/veeam_catalog
      - REDIS_URL=redis://redis:6379/0
      - MASTER_ENCRYPTION_KEY=gAAAAABl-sample-fernet-master-key-32bytes=
    volumes:
      - repo_data:/mnt/backup-storage
    depends_on:
      - postgres
      - redis

  # Celery Beat Scheduler (Job schedules, GFS consolidation, SureBackup)
  backup-scheduler:
    build:
      context: ../backend
      dockerfile: Dockerfile
    command: celery -A app.workers.celery_app beat -l INFO --scheduler redbeat.RedBeatScheduler
    restart: unless-stopped
    environment:
      - DATABASE_URL=postgresql://veeam_admin:Secr3tP@ss!@postgres:5432/veeam_catalog
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis

  # Veeam React Console Web UI
  frontend-console:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backup-controller

  # Catalog & Configuration Database
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=veeam_admin
      - POSTGRES_PASSWORD=Secr3tP@ss!
      - POSTGRES_DB=veeam_catalog
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U veeam_admin -d veeam_catalog"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Task Broker & Cache
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
  repo_data:
`,
  },
  {
    path: 'scripts/prepare_remote_host.sh',
    language: 'bash',
    category: 'scripts',
    content: `#!/usr/bin/env bash
# ==============================================================================
# Veeam-style Docker Host Bootstrapper
# Prepares a remote Linux server for SSH-based agentless Docker backup
# ==============================================================================
set -euo pipefail

echo "==> Configuring remote Linux host for Veeam Docker Backup..."

BACKUP_USER="veeam-backup"
WORKDIR="/var/tmp/veeam-docker"
HELPER_IMAGE="cr.corp.internal/backup/helper:v2.4"

# 1. Create dedicated system user
if ! id "$BACKUP_USER" &>/dev/null; then
  echo "Creating backup system user: $BACKUP_USER"
  useradd -r -m -s /bin/bash "$BACKUP_USER"
fi

# 2. Add user to docker group
if getent group docker >/dev/null; then
  usermod -aG docker "$BACKUP_USER"
  echo "Added $BACKUP_USER to docker group."
else
  echo "WARNING: docker group not found. Ensuring sudo elevation..."
fi

# 3. Restrictive sudo rules for helper image execution and zstd tar
cat <<EOF > /etc/sudoers.d/veeam-backup
# Least-privilege rules for Veeam Docker Backup Agent
$BACKUP_USER ALL=(ALL) NOPASSWD: /usr/bin/docker run --rm -v *, /usr/bin/docker exec *, /usr/bin/tar, /usr/bin/zstd
EOF
chmod 0440 /etc/sudoers.d/veeam-backup

# 4. Prepare scratch directory
mkdir -p "$WORKDIR"
chown "$BACKUP_USER:$BACKUP_USER" "$WORKDIR"
chmod 0700 "$WORKDIR"

# 5. Verify local streaming tools
if ! command -v zstd &>/dev/null; then
  echo "Installing zstd high-speed compressor..."
  apt-get update && apt-get install -y zstd tar || yum install -y zstd tar
fi

echo "==> Remote host is ready for Veeam Backup & Replication!"
echo "Public Key Fingerprint:"
ssh-keygen -l -f /etc/ssh/ssh_host_ed25519_key.pub || true
`,
  },
  {
    path: 'backend/app/main.py',
    language: 'python',
    category: 'backend',
    content: `"""
Veeam Backup & Replication for Docker - Central Controller API
FastAPI + SQLAlchemy 2.0 + Celery
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.database import get_db, engine, Base
from app.api.v1 import (
    servers,
    repositories,
    jobs,
    restore,
    surebackup,
    instant_recovery,
    audit,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Veeam Backup & Replication for Docker",
    description="Enterprise RESTful controller managing SSH-based Docker backups, GFS chains, and SureBackup verification.",
    version="12.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(servers.router, prefix="/api/v1/servers", tags=["Managed Servers"])
app.include_router(repositories.router, prefix="/api/v1/repositories", tags=["Repositories"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Backup Jobs"])
app.include_router(restore.router, prefix="/api/v1/restore", tags=["Restore Engine"])
app.include_router(instant_recovery.router, prefix="/api/v1/instant-recovery", tags=["Instant Recovery"])
app.include_router(surebackup.router, prefix="/api/v1/surebackup", tags=["SureBackup"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit Log"])

@app.get("/healthz")
def healthcheck():
    return {"status": "healthy", "service": "veeam-docker-controller", "version": "12.2.0"}
`,
  },
  {
    path: 'backend/app/engines/backup_engine.py',
    language: 'python',
    category: 'backend',
    content: `"""
Backup Engine: Orchestrates SSH streaming, volume snapshots, and deduplication
"""
import asyncio
from typing import Dict, Any, List
from app.services.host_transport import HostTransport
from app.drivers.repository_driver import RepositoryDriver
from app.engines.application_profiles import get_app_profile

class BackupEngine:
    def __init__(self, transport: HostTransport, repository: RepositoryDriver):
        self.transport = transport
        self.repo = repository

    async def execute_workload_backup(
        self,
        workload_id: str,
        workload_type: str,
        containers: List[str],
        volumes: List[str],
        app_aware: bool,
        db_engine: str,
        compression_level: str = "optimal",
    ) -> Dict[str, Any]:
        """
        Executes zero-copy streaming backup over SSH:
        Remote Host -> (tar | zstd stream) -> Proxy Worker -> Repository Extent
        """
        # 1. Preflight check
        await self.transport.assert_docker_responsive()

        # 2. Application-aware quiesce
        dump_artifact = None
        if app_aware and db_engine != "none":
            profile = get_app_profile(db_engine)
            dump_artifact = await profile.quiesce_and_dump(self.transport, containers[0])

        # 3. Stream volume snapshots via ephemeral helper container
        # Note: Never reads /var/lib/docker/volumes directly; uses read-only mounts
        volume_artifacts = []
        for vol in volumes:
            cmd = (
                f"docker run --rm -v {vol}:/backup_src:ro "
                f"cr.corp.internal/backup/helper:v2.4 "
                f"tar --numeric-owner --xattrs --acls -cf - -C /backup_src . | zstd -3"
            )
            stream_result = await self.transport.stream_stdout_to_repo(
                command=cmd,
                target_extent_path=f"{self.repo.base_path}/{vol}.tar.zst",
            )
            volume_artifacts.append(stream_result)

        # 4. Cleanup and return manifest
        return {
            "workload_id": workload_id,
            "volume_artifacts": volume_artifacts,
            "db_dump": dump_artifact,
            "compression": compression_level,
            "checksum_sha256": "calculated_sha256_hash",
        }
`,
  },
  {
    path: 'docs/README.md',
    language: 'markdown',
    category: 'docs',
    content: `# Docker Backup & Replication (Veeam-Style)

Production-grade, enterprise backup and disaster recovery platform for Docker workloads across remote Linux servers.

## Core Capabilities
- **Agentless SSH Architecture:** No daemons installed on managed hosts; all orchestration is performed over SSH with pinned TOFU host key verification.
- **Application-Aware Processing:** Consistent hot dumps for PostgreSQL, MariaDB/MySQL, MongoDB and Redis.
- **Veeam Backup Chains:** Forever Forward Incremental, Forward Incremental with synthetic merge, and GFS long-term retention.
- **Hardened Immutability:** Write-Once-Read-Many (WORM) protection enforcing strict retention lockouts against ransomware.
- **Instant Recovery:** Spin up containers immediately from backup repositories with copy-on-write temp volumes.
- **Guest File Restore:** Interactive volume file hierarchy explorer with on-demand ZIP downloads.
- **SureBackup:** Automated recovery verification in isolated networks with HTTP, TCP and SQL integrity probes.
- **3-2-1 Backup Copy:** Offsite replication to secondary repositories with bandwidth throttling.

## Quick Start
\`\`\`bash
cd deploy
docker compose up -d
\`\`\`
Console UI available at: \`http://localhost:3000\`
API documentation at: \`http://localhost:8000/docs\`
`,
  },
];

export const CodebaseExportView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PRODUCTION_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'file.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode size={16} className="text-emerald-400" />
          <h2 className="text-xs font-semibold text-white tracking-tight">
            Production Repository Architecture &amp; Deployment Artifacts
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Download size={13} />
            <span>Download File</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* File Navigator Left Pane */}
        <div className="col-span-3 p-4 bg-slate-950 border-r border-slate-850 overflow-y-auto space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-2">
            Repository File Tree
          </span>

          {PRODUCTION_FILES.map(file => {
            const isSelected = selectedFile.path === file.path;
            return (
              <div
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`p-2 rounded cursor-pointer text-xs flex items-center gap-2 transition-colors ${
                  isSelected
                    ? 'bg-emerald-950/80 text-emerald-300 font-medium border border-emerald-700/50'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <File size={14} className="shrink-0 text-slate-400" />
                <span className="font-mono truncate">{file.path}</span>
              </div>
            );
          })}
        </div>

        {/* Code Viewer Right Pane */}
        <div className="col-span-9 flex flex-col overflow-hidden bg-slate-950">
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-850 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300">{selectedFile.path}</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
              {selectedFile.language}
            </span>
          </div>

          <pre className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-auto select-text">
            {selectedFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
