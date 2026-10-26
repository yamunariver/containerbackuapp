# Docker Backup & Replication (Veeam-Style)

Enterprise-grade backup, replication, and disaster recovery platform for Docker workloads across remote Linux servers.

```
                    ┌──────────────────────────────────────────────┐
                    │      Veeam Backup Server (Controller)        │
                    │  FastAPI API + Celery Beat + PostgreSQL DB   │
                    │         React TypeScript Web Console         │
                    └──────────────────────┬───────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        ▼                                     ▼
        ┌───────────────────────────────┐     ┌───────────────────────────────┐
        │   Backup Proxy Worker (US)    │     │   Backup Proxy Worker (EU)    │
        │  Data mover · Task semaphores │     │  Data mover · Task semaphores │
        └───────────────┬───────────────┘     └───────────────┬───────────────┘
                        │ (SSH Tar | Zstd Stream)             │
                        ▼                                     ▼
        ┌───────────────────────────────┐     ┌───────────────────────────────┐
        │   Managed Linux Host 01       │     │   Managed Linux Host 02       │
        │   Agentless SSH · Docker CLI  │     │   Agentless SSH · Docker CLI  │
        │   Helper Container (ReadOnly) │     │   Helper Container (ReadOnly) │
        └───────────────────────────────┘     └───────────────────────────────┘
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │       Backup Repositories & SOBR Vault       │
                    │  Local NVMe · NFSv4 · SMB · S3 Object Lock   │
                    │     WORM Immutability · GFS Retention        │
                    └──────────────────────────────────────────────┘
```

## Features
1. **Agentless SSH Orchestration**: Pure SSH transport using Paramiko/AsyncSSH with TOFU host key fingerprint verification.
2. **Application-Aware Guest Processing**: Consistent hot dumps for PostgreSQL (`pg_dumpall`), MySQL/MariaDB (`--single-transaction`), MongoDB (`mongodump`), and Redis (`BGSAVE`).
3. **Veeam Backup Chains**: Forever Forward Incremental with synthetic merge and GFS (Weekly, Monthly, Yearly) archiving.
4. **Hardened Repository Immutability**: Enforces Linux `chattr +i` and S3 Object Lock for N days to prevent ransomware destruction.
5. **SureBackup Verification**: Automated recovery verification jobs that restore workloads into isolated Docker networks and run HTTP/DB health checks.
6. **Instant Recovery**: Launches container workloads directly from backup repositories within seconds with copy-on-write temp storage.
7. **Guest File Restore**: Interactive volume file tree explorer in the UI with direct ZIP archive downloads.
8. **3-2-1 Backup Copy Jobs**: Offsite replication to secondary repositories with bandwidth throttling.

## First-Run Admin Bootstrap
1. Deploy the stack:
   ```bash
   cd deploy
   docker compose up -d
   ```
2. Open the console at `http://localhost:3000`.
3. Log in with initial administrator credentials (`admin` / default master key).
4. Run `scripts/prepare_remote_host.sh` on your target Linux Docker hosts.
5. In the UI, click **Add Server** to initiate SSH handshake and component probe.
