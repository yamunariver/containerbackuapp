# Disaster Recovery & Restore Guide

This guide details all restore modalities available in Docker Backup & Replication.

## Modality 1: Full Workload Restore
Use when a server has suffered complete hardware or volume loss.
1. In the console, navigate to **Backups** and select the desired point-in-time restore point.
2. Click **Restore Workload**.
3. Choose the target managed server (original or alternate migration target).
4. Configure optional container name and published port overrides to prevent collisions.
5. Review pre-restore validation results (free space, port conflicts, SSH stream responsiveness).
6. Click **Start Restore Execution**.

## Modality 2: Instant Recovery
Use for near-zero RTO (Recovery Time Objective) emergency workloads.
1. Select the restore point in **Backups**.
2. Click **Instant Recovery**.
3. Enter an isolated port (e.g. 9095) and temporary container name.
4. Click **Start Instant Recovery**.
5. The container starts within < 3 seconds using ephemeral copy-on-write scratch storage.
6. Verify service health. When ready:
   - Click **Finalize** to permanently promote the workload to production storage.
   - Click **Stop & Discard** to destroy the test instance without affecting backup data.

## Modality 3: Guest File Restore (Volume Browser)
Use when an operator needs to recover an accidentally deleted configuration file, database backup, or document.
1. Select the restore point and click **Guest Files**.
2. Navigate the virtual file tree or use the search bar.
3. Choose to either:
   - Click **Download as ZIP Archive** to package the files on-the-fly and download to your desktop.
   - Select a destination Linux server and path to stream the file back with original ACLs and ownership preserved.
