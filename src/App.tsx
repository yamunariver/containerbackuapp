import React, { useState, useEffect } from 'react';
import { veeamStore } from './services/veeamStore';
import { RestorePoint, JobSession } from './types/veeam';
import { VeeamTopRibbon } from './components/VeeamTopRibbon';
import { VeeamLeftNav } from './components/VeeamLeftNav';
import { VeeamJobStatisticsPane } from './components/VeeamJobStatisticsPane';

// Views
import { DashboardView } from './components/views/DashboardView';
import { JobsView } from './components/views/JobsView';
import { BackupsView } from './components/views/BackupsView';
import { InfrastructureView } from './components/views/InfrastructureView';
import { InventoryView } from './components/views/InventoryView';
import { SessionsView } from './components/views/SessionsView';
import { SureBackupView } from './components/views/SureBackupView';
import { InstantRecoveryView } from './components/views/InstantRecoveryView';
import { ReportsView } from './components/views/ReportsView';
import { SecurityView } from './components/views/SecurityView';
import { CodebaseExportView } from './components/views/CodebaseExportView';

// Wizards
import { AddServerWizard } from './components/wizards/AddServerWizard';
import { NewBackupJobWizard } from './components/wizards/NewBackupJobWizard';
import { NewCopyJobWizard } from './components/wizards/NewCopyJobWizard';
import { AddRepositoryWizard } from './components/wizards/AddRepositoryWizard';
import { RestoreWorkloadWizard } from './components/wizards/RestoreWorkloadWizard';
import { InstantRecoveryWizard } from './components/wizards/InstantRecoveryWizard';
import { SureBackupWizard } from './components/wizards/SureBackupWizard';

export default function App() {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<JobSession | null>(null);

  // Wizard Dialog States
  const [showAddServer, setShowAddServer] = useState(false);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showNewCopyJob, setShowNewCopyJob] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [showInstantRecovery, setShowInstantRecovery] = useState(false);
  const [showSureBackup, setShowSureBackup] = useState(false);
  const [targetRestorePoint, setTargetRestorePoint] = useState<RestorePoint | null>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = veeamStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsubscribe;
  }, []);

  // Sync selected session with running job session if one exists
  const sessions = veeamStore.getSessions();
  const runningSession = sessions.find(s => s.status === 'running');
  const activeSession = runningSession || selectedSession || sessions[0] || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f17] text-slate-200 overflow-hidden font-sans">
      {/* 1. Veeam Top Ribbon with Category Tabs & Context Actions */}
      <VeeamTopRibbon
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddServer={() => setShowAddServer(true)}
        onOpenNewJob={() => setShowNewJob(true)}
        onOpenNewCopyJob={() => setShowNewCopyJob(true)}
        onOpenAddRepo={() => setShowAddRepo(true)}
        onOpenRestore={() => {
          setTargetRestorePoint(null);
          setShowRestore(true);
        }}
        onOpenInstantRecovery={() => {
          setTargetRestorePoint(null);
          setShowInstantRecovery(true);
        }}
        onOpenSureBackup={() => setShowSureBackup(true)}
        selectedJobId={selectedJobId}
      />

      {/* 2. Middle Workspace: Left Tree Navigation + Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Explorer */}
        <VeeamLeftNav activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Center Main Stage Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
          {activeTab === 'home' && (
            <DashboardView
              onOpenNewJob={() => setShowNewJob(true)}
              onOpenRestore={() => setShowRestore(true)}
              onOpenAddServer={() => setShowAddServer(true)}
              onSelectJob={id => {
                setSelectedJobId(id);
                setActiveTab('jobs');
              }}
            />
          )}

          {activeTab === 'jobs' && (
            <JobsView
              onOpenNewJob={() => setShowNewJob(true)}
              onOpenNewCopyJob={() => setShowNewCopyJob(true)}
              onSelectJob={id => setSelectedJobId(id)}
              selectedJobId={selectedJobId}
            />
          )}

          {activeTab === 'backups' && (
            <BackupsView
              onOpenRestore={rp => {
                setTargetRestorePoint(rp);
                setShowRestore(true);
              }}
              onOpenInstantRecovery={rp => {
                setTargetRestorePoint(rp);
                setShowInstantRecovery(true);
              }}
            />
          )}

          {activeTab === 'infrastructure' && (
            <InfrastructureView
              onOpenAddServer={() => setShowAddServer(true)}
              onOpenAddRepo={() => setShowAddRepo(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView onOpenNewJob={() => setShowNewJob(true)} />
          )}

          {activeTab === 'sessions' && (
            <SessionsView
              onSelectSession={sess => setSelectedSession(sess)}
              selectedSessionId={activeSession?.id}
            />
          )}

          {activeTab === 'surebackup' && (
            <SureBackupView onOpenSureBackup={() => setShowSureBackup(true)} />
          )}

          {activeTab === 'instant-recovery' && (
            <InstantRecoveryView
              onOpenInstantRecovery={() => setShowInstantRecovery(true)}
            />
          )}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'security' && <SecurityView />}

          {activeTab === 'codebase' && <CodebaseExportView />}
        </main>
      </div>

      {/* 3. Bottom Veeam Job Statistics & Bottleneck & Live Log Pane */}
      <VeeamJobStatisticsPane
        session={activeSession}
        onStopJob={jobId => veeamStore.stopJob(jobId)}
      />

      {/* Interactive Wizards & Dialogs */}
      {showAddServer && (
        <AddServerWizard
          onClose={() => setShowAddServer(false)}
          onSuccess={() => {
            setShowAddServer(false);
            setActiveTab('infrastructure');
          }}
        />
      )}

      {showNewJob && (
        <NewBackupJobWizard
          onClose={() => setShowNewJob(false)}
          onSuccess={() => {
            setShowNewJob(false);
            setActiveTab('jobs');
          }}
        />
      )}

      {showNewCopyJob && (
        <NewCopyJobWizard
          onClose={() => setShowNewCopyJob(false)}
          onSuccess={() => {
            setShowNewCopyJob(false);
            setActiveTab('jobs');
          }}
        />
      )}

      {showAddRepo && (
        <AddRepositoryWizard
          onClose={() => setShowAddRepo(false)}
          onSuccess={() => {
            setShowAddRepo(false);
            setActiveTab('infrastructure');
          }}
        />
      )}

      {showRestore && (
        <RestoreWorkloadWizard
          initialRestorePoint={targetRestorePoint}
          onClose={() => setShowRestore(false)}
          onSuccess={() => {
            setShowRestore(false);
            setActiveTab('sessions');
          }}
        />
      )}

      {showInstantRecovery && (
        <InstantRecoveryWizard
          initialRestorePoint={targetRestorePoint}
          onClose={() => setShowInstantRecovery(false)}
          onSuccess={() => {
            setShowInstantRecovery(false);
            setActiveTab('instant-recovery');
          }}
        />
      )}

      {showSureBackup && (
        <SureBackupWizard
          onClose={() => setShowSureBackup(false)}
          onSuccess={() => {
            setShowSureBackup(false);
            setActiveTab('surebackup');
          }}
        />
      )}
    </div>
  );
}
