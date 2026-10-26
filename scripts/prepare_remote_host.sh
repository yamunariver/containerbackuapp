#!/usr/bin/env bash
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

# 2. Add user to docker group if present
if getent group docker >/dev/null; then
  usermod -aG docker "$BACKUP_USER"
  echo "Added $BACKUP_USER to docker group."
else
  echo "docker group not found. Relying on sudo elevation rules."
fi

# 3. Setup SSH directory
mkdir -p "/home/$BACKUP_USER/.ssh"
chmod 0700 "/home/$BACKUP_USER/.ssh"
touch "/home/$BACKUP_USER/.ssh/authorized_keys"
chmod 0600 "/home/$BACKUP_USER/.ssh/authorized_keys"
chown -R "$BACKUP_USER:$BACKUP_USER" "/home/$BACKUP_USER/.ssh"

# 4. Restrictive sudo rules for helper image execution and zstd tar
cat <<EOF > /etc/sudoers.d/veeam-backup
# Least-privilege rules for Veeam Docker Backup Agentless Transport
$BACKUP_USER ALL=(ALL) NOPASSWD: /usr/bin/docker run --rm -v *, /usr/bin/docker exec *, /usr/bin/tar, /usr/bin/zstd
EOF
chmod 0440 /etc/sudoers.d/veeam-backup

# 5. Prepare scratch directory
mkdir -p "$WORKDIR"
chown "$BACKUP_USER:$BACKUP_USER" "$WORKDIR"
chmod 0700 "$WORKDIR"

# 6. Verify local streaming tools
if ! command -v zstd &>/dev/null; then
  echo "Installing zstd high-speed compressor..."
  if command -v apt-get &>/dev/null; then
    apt-get update && apt-get install -y zstd tar
  elif command -v yum &>/dev/null; then
    yum install -y zstd tar
  fi
fi

echo "==> Remote host is ready for Veeam Backup & Replication!"
echo "Server Public Key Fingerprint:"
ssh-keygen -l -f /etc/ssh/ssh_host_ed25519_key.pub 2>/dev/null || true
