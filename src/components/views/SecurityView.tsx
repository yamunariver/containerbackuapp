import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import { Credential, AuditLogEntry } from '../../types/veeam';
import {
  Key,
  Shield,
  FileText,
  Lock,
  Plus,
  Search,
  CheckCircle2,
  Users,
  Download,
} from 'lucide-react';

export const SecurityView: React.FC = () => {
  const [subTab, setSubTab] = useState<'credentials' | 'rbac' | 'audit'>('credentials');
  const credentials = veeamStore.getCredentials();
  const auditLogs = veeamStore.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');

  // Add Credential Form
  const [showAddCred, setShowAddCred] = useState(false);
  const [credName, setCredName] = useState('');
  const [credUsername, setCredUsername] = useState('');
  const [credType, setCredType] = useState<'ssh_key' | 'password'>('ssh_key');
  const [credSecret, setCredSecret] = useState('');
  const [credDesc, setCredDesc] = useState('');

  const handleSaveCred = () => {
    veeamStore.addCredential({
      name: credName || 'New Credential',
      username: credUsername || 'root',
      type: credType,
      hasPassphrase: false,
      description: credDesc,
      fingerprint: credType === 'ssh_key' ? 'SHA256:77aa88bb...99cc' : undefined,
    });
    setShowAddCred(false);
    setCredName('');
    setCredUsername('');
    setCredSecret('');
  };

  const filteredLogs = auditLogs.filter(
    l =>
      searchTerm === '' ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden text-slate-200">
      {/* Subtab Header */}
      <div className="h-12 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setSubTab('credentials')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'credentials'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credentials Manager ({credentials.length})
          </button>
          <button
            onClick={() => setSubTab('rbac')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'rbac'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RBAC Roles &amp; Permissions
          </button>
          <button
            onClick={() => setSubTab('audit')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'audit'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Immutable Audit Log ({auditLogs.length})
          </button>
        </div>

        {subTab === 'credentials' && (
          <button
            onClick={() => setShowAddCred(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            <span>Add Encrypted Credential</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* TAB 1: CREDENTIALS */}
        {subTab === 'credentials' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white">Central Encrypted Credential Store</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Credentials are encrypted at rest with AES-256 GCM using a master key from environment/secrets. Passwords and private keys are never returned in plain text by the API and are referenced purely by ID.
                </p>
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Lock size={13} /> AES-256 Encrypted
              </span>
            </div>

            {showAddCred && (
              <div className="p-5 bg-slate-900 border border-emerald-600/40 rounded-lg space-y-4 max-w-xl">
                <h4 className="text-xs font-semibold text-white">Store New Encrypted Credential</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 block mb-1">Credential Name</label>
                    <input
                      type="text"
                      placeholder="e.g. staging-ed25519-key"
                      value={credName}
                      onChange={e => setCredName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. backup-agent"
                      value={credUsername}
                      onChange={e => setCredUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-300 block mb-1">Credential Type</label>
                    <select
                      value={credType}
                      onChange={e => setCredType(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    >
                      <option value="ssh_key">SSH Private Key (ed25519 / RSA)</option>
                      <option value="password">Password / Database Superuser</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Secret / Private Key</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={credSecret}
                      onChange={e => setCredSecret(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setShowAddCred(false)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCred}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium"
                  >
                    Encrypt &amp; Save
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {credentials.map(c => (
                <div
                  key={c.id}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-amber-400" />
                        <h4 className="text-xs font-semibold text-white truncate max-w-[150px]">
                          {c.name}
                        </h4>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono uppercase">
                        {c.type === 'ssh_key' ? 'SSH Key' : 'Password'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-1">
                      User: <strong className="text-slate-200">{c.username}</strong>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{c.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Last Used: {c.lastUsedAt.substring(11, 16)}</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Lock size={10} /> Encrypted
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: RBAC ROLES */}
        {subTab === 'rbac' && (
          <div className="space-y-4 max-w-4xl">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
              <h3 className="text-xs font-semibold text-white">Enterprise Role-Based Access Control</h3>
              <p className="text-[11px] text-slate-400">
                Grant least-privilege permissions across operations teams, restore operators, and compliance auditors. Supports Active Directory / LDAP groups and TOTP MFA.
              </p>
            </div>

            <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-900 text-xs">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Backup Administrator</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unrestricted full access to backup server, managed hosts, repositories, credentials and destruction policies.
                  </p>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">Superuser</span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Backup Operator</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Permission to initiate, stop and retry backup jobs and copy jobs. Cannot modify repositories or view credentials.
                  </p>
                </div>
                <span className="text-[11px] text-sky-400 font-mono">Operations</span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Restore Operator</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Restricted strictly to executing Workload Restore, Instant Recovery, and Guest File browsing. Zero job modification rights.
                  </p>
                </div>
                <span className="text-[11px] text-amber-400 font-mono">Restores Only</span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Security &amp; Compliance Auditor</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Read-only access to audit logs, SLA reports, immutability expiration timers, and SureBackup certificates.
                  </p>
                </div>
                <span className="text-[11px] text-purple-400 font-mono">Read-Only</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOG */}
        {subTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative w-80">
                <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter audit logs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Append-only forensic log (WORM compliance)
              </span>
            </div>

            <div className="border border-slate-800 rounded bg-slate-950 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-850 text-[11px]">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-3">User &amp; Role</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target Workload / Host</th>
                    <th className="py-2.5 px-4">Details</th>
                    <th className="py-2.5 px-3">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/60 text-slate-300">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        {log.timestamp}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className="font-medium text-white">{log.user}</span>
                        <span className="text-[10px] text-slate-500 block font-mono uppercase">
                          {log.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400 font-semibold">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-white font-medium">{log.target}</td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px] max-w-md truncate">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
