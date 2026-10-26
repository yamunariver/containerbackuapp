import React, { useState } from 'react';
import { veeamStore } from '../../services/veeamStore';
import {
  Server,
  Key,
  ShieldCheck,
  FolderCog,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddServerWizard: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const credentials = veeamStore.getCredentials();

  // Form State
  const [serverName, setServerName] = useState('');
  const [hostAddress, setHostAddress] = useState('');
  const [sshPort, setSshPort] = useState(22);
  const [selectedCredId, setSelectedCredId] = useState(credentials[0]?.id || '');
  const [sudoMode, setSudoMode] = useState(true);
  const [remoteWorkDir, setRemoteWorkDir] = useState('/var/tmp/veeam-docker');
  const [helperImage, setHelperImage] = useState('cr.corp.internal/backup/helper:v2.4');

  // TOFU Verification
  const [fingerprint, setFingerprint] = useState('SHA256:d8a9f4c3b2e1...8f0a (ed25519 256-bit)');
  const [fingerprintAccepted, setFingerprintAccepted] = useState(false);

  // Component Check States
  const [probing, setProbing] = useState(false);
  const [probeResults, setProbeResults] = useState<{
    ssh: boolean;
    docker: boolean;
    helper: boolean;
    zstd: boolean;
    space: boolean;
  } | null>(null);

  const runComponentProbe = () => {
    setProbing(true);
    setProbeResults(null);
    setTimeout(() => {
      setProbeResults({
        ssh: true,
        docker: true,
        helper: true,
        zstd: true,
        space: true,
      });
      setProbing(false);
    }, 1800);
  };

  const handleFinish = () => {
    veeamStore.addServer({
      name: serverName || hostAddress,
      host: hostAddress,
      sshPort,
      credentialsId: selectedCredId,
      sudoMode,
      tofuFingerprint: fingerprint,
      isFingerprintPinned: true,
      remoteWorkDir,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]">
        {/* Wizard Header */}
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded text-emerald-400">
              <Server size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                Add Managed Linux Server Wizard
              </h2>
              <span className="text-xs text-slate-400">
                Step {step} of 5: {
                  step === 1 ? 'Connection Settings' :
                  step === 2 ? 'SSH Credentials & TOFU Verification' :
                  step === 3 ? 'Docker Host Configuration' :
                  step === 4 ? 'Component Probe & Review' : 'Summary'
                }
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X size={16} />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="grid grid-cols-5 bg-slate-950/60 border-b border-slate-800 text-[11px] font-medium text-slate-400">
          <div className={`py-2 text-center border-b-2 ${step === 1 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            1. Host
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 2 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            2. Credentials
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 3 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            3. Docker
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 4 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            4. Probe
          </div>
          <div className={`py-2 text-center border-b-2 ${step === 5 ? 'border-emerald-500 text-emerald-400 bg-slate-900' : 'border-transparent'}`}>
            5. Summary
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. prod-docker-04.us-west.corp"
                  value={serverName}
                  onChange={e => setServerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400 text-[11px] mt-0.5 block">Identifiable name in Veeam console inventory.</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-slate-300 font-medium block mb-1">DNS Name or IP Address</label>
                  <input
                    type="text"
                    placeholder="10.240.10.95 or docker4.corp.internal"
                    value={hostAddress}
                    onChange={e => setHostAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">SSH Port</label>
                  <input
                    type="number"
                    value={sshPort}
                    onChange={e => setSshPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded text-slate-300 leading-relaxed">
                <strong className="text-slate-200">Agentless Architecture:</strong> All transport communicates directly over SSH. No persistent daemon required on the Docker host. The Backup Proxy connects via SSH and streams volume data through an ephemeral read-only helper container.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Credentials</label>
                <select
                  value={selectedCredId}
                  onChange={e => setSelectedCredId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {credentials.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.username} · {c.type === 'ssh_key' ? 'SSH Key' : 'Password'})
                    </option>
                  ))}
                </select>
                <span className="text-slate-400 text-[11px] mt-0.5 block">
                  Encrypted at rest using AES-256 GCM master key.
                </span>
              </div>

              {/* TOFU (Trust On First Use) Host Key Verification */}
              <div className="p-4 bg-slate-950 border border-amber-600/30 rounded space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-medium">
                  <ShieldCheck size={16} />
                  <span>Trust On First Use (TOFU) Host Key Verification</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  The remote host presented the following public key fingerprint. Verify this fingerprint against your server console before pinning to prevent MITM attacks:
                </p>
                <div className="p-2 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-emerald-400 select-all">
                  {fingerprint}
                </div>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fingerprintAccepted}
                    onChange={e => setFingerprintAccepted(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span className="text-slate-200 font-medium">
                    I verify and pin this host key fingerprint to known_hosts database.
                  </span>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded">
                <div>
                  <span className="font-medium text-slate-200 block">Elevate to Root via Sudo</span>
                  <span className="text-slate-400 text-[11px]">
                    Required if the SSH user is not in the docker group or requires root volume tar extraction.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sudoMode}
                  onChange={e => setSudoMode(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Remote Temporary Working Directory</label>
                <input
                  type="text"
                  value={remoteWorkDir}
                  onChange={e => setRemoteWorkDir(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400 text-[11px] mt-0.5 block">
                  Used solely for ephemeral sockets, pipe descriptors, and pre-freeze dumps. Automatically cleaned up.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Helper Container Image</label>
                <input
                  type="text"
                  value={helperImage}
                  onChange={e => setHelperImage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-400 text-[11px] mt-0.5 block">
                  Read-only helper containing zstd and tar. Supports air-gapped / internal container registries.
                </span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-200 text-xs">Automated Remote Component Check</h3>
                  <span className="text-slate-400 text-[11px]">Probe connectivity, Docker API, tools and storage.</span>
                </div>
                <button
                  onClick={runComponentProbe}
                  disabled={probing}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  {probing && <Loader2 size={13} className="animate-spin" />}
                  {probing ? 'Probing Host...' : 'Run Probe Now'}
                </button>
              </div>

              {probeResults ? (
                <div className="space-y-2 border border-slate-800 rounded bg-slate-950 p-3">
                  <div className="flex items-center justify-between py-1 border-b border-slate-850">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>SSH Connectivity & Host Key Match</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">22 ms (Connected)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-850">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Docker Daemon API</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">Docker 27.2.0 (API 1.47)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-850">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Helper Image Availability</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">Cached (14.2 MB)</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-850">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Stream Utilities (zstd + tar)</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">zstd v1.5.5 / tar 1.35</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Temporary Scratch Space</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[11px]">450 GB Free</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded text-slate-500">
                  Click &ldquo;Run Probe Now&rdquo; to test remote SSH, Docker API and streaming tools.
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-200">Review Managed Server Details</h3>
              <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Server Name</span>
                    <span className="text-white font-medium">{serverName || hostAddress}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Address & Port</span>
                    <span className="text-white font-mono">{hostAddress}:{sshPort}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sudo Elevation</span>
                    <span className="text-white">{sudoMode ? 'Enabled' : 'Disabled (Rootless)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Working Directory</span>
                    <span className="text-white font-mono">{remoteWorkDir}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Helper Image</span>
                    <span className="text-white font-mono">{helperImage}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Host Fingerprint</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Pinned (TOFU Verified)</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-600/30 rounded text-emerald-300 text-xs">
                Upon clicking Finish, this host will be cataloged and automated inventory discovery will identify running containers, Compose stacks, volumes and networks.
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
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

            {step < 5 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !hostAddress}
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
                Finish & Add Server
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
