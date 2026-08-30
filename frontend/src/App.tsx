import React, { useState, useEffect, useCallback } from 'react';
import { Bot } from 'lucide-react';
import {
  fetchMerchants,
  fetchDashboardSummary,
  fetchRiskFlags,
  fetchTimeline,
  resetDemoDataset
} from './services/api';
import { Merchant, RiskFlag, DashboardSummary, AuditLog } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { AlertTriagePage } from './components/AlertTriagePage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { SettingsPage } from './components/SettingsPage';
import { EvidenceModal } from './components/EvidenceModal';
import { CopilotDrawer } from './components/CopilotDrawer';
import { SimulationModal } from './components/SimulationModal';

export function App() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [flags, setFlags] = useState<RiskFlag[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFlag, setSelectedFlag] = useState<RiskFlag | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async (merchantId?: string) => {
    try {
      setIsLoading(true);
      const [merchantsData, summaryData, flagsData, timelineData] = await Promise.all([
        fetchMerchants(),
        fetchDashboardSummary(merchantId),
        fetchRiskFlags(merchantId),
        fetchTimeline()
      ]);

      setMerchants(merchantsData);
      if (!selectedMerchant && merchantsData.length > 0) {
        setSelectedMerchant(merchantsData[0]);
      }
      setSummary(summaryData);
      setFlags(flagsData);
      setAuditLogs(timelineData.audit_logs);
    } catch (err) {
      console.error('Error loading Sentinel data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMerchant]);

  useEffect(() => {
    loadData(selectedMerchant?.id);
  }, [selectedMerchant?.id]);

  const handleReviewed = (updatedFlag: RiskFlag) => {
    setFlags((prev) => prev.map((f) => (f.id === updatedFlag.id ? updatedFlag : f)));
    setSelectedFlag(null);
    loadData(selectedMerchant?.id);
  };

  const handleResetData = async () => {
    if (!confirm('Reset local database to initial demo baseline?')) return;
    try {
      await resetDemoDataset();
      alert('Database reset to clean baseline.');
      loadData(selectedMerchant?.id);
    } catch (e: any) {
      alert(`Reset failed: ${e.message}`);
    }
  };

  const unreviewedCount = flags.filter(
    (f) => f.status === 'open' || f.status === 'context_requested'
  ).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1b1b23] flex flex-col font-sans antialiased">
      {/* 1. Full-Width Top App Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        merchants={merchants}
        selectedMerchant={selectedMerchant}
        onSelectMerchant={(m) => setSelectedMerchant(m)}
        unreviewedCount={unreviewedCount}
        onOpenSimulation={() => setSimulationOpen(true)}
        onToggleCopilot={() => setCopilotOpen(!copilotOpen)}
        copilotOpen={copilotOpen}
        onRefresh={() => loadData(selectedMerchant?.id)}
        isLoading={isLoading}
      />

      {/* 2. Main View Body: Left Sidebar + Page View */}
      <div className="flex flex-1 relative">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          unreviewedCount={unreviewedCount}
          onResetData={handleResetData}
        />

        {/* Main Content Pages Container */}
        <main className="flex-grow pl-24 pr-8 py-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <DashboardOverview
              merchant={selectedMerchant}
              summary={summary}
              flags={flags}
              onSelectFlag={(flag) => setSelectedFlag(flag)}
              onNavigateToAlerts={() => setActiveTab('alerts')}
              onNavigateToSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertTriagePage
              flags={flags}
              onSelectFlag={(flag) => setSelectedFlag(flag)}
              selectedFlagId={selectedFlag?.id}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage
              summary={summary}
              auditLogs={auditLogs}
              merchant={selectedMerchant}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              onResetComplete={() => loadData(selectedMerchant?.id)}
            />
          )}
        </main>
      </div>

      {/* 3. Evidence Breakdown & Human Review Decision Modal */}
      <EvidenceModal
        flag={selectedFlag}
        onClose={() => setSelectedFlag(null)}
        onReviewed={handleReviewed}
      />

      {/* 4. Live Mule Pattern Simulation Modal */}
      <SimulationModal
        isOpen={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        merchantId={selectedMerchant?.id}
        onSimulationComplete={() => loadData(selectedMerchant?.id)}
      />

      {/* 5. AI Sentinel Copilot Side Drawer (Powered by Gemini) */}
      <CopilotDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        selectedFlag={selectedFlag}
        merchant={selectedMerchant}
      />

      {/* 6. Fixed Floating "Analyst Copilot" Trigger Widget (Bottom-Right Viewport) */}
      <button
        onClick={() => setCopilotOpen(!copilotOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3.5 shadow-xl hover:shadow-2xl rounded-2xl flex flex-col items-center justify-center cursor-pointer border border-blue-400/30 transition-all duration-300 ease-out hover:scale-110 group"
        title="Ask Sentinel Copilot (Gemini AI)"
      >
        <div className="relative">
          <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-blue-600 animate-pulse"></span>
        </div>
        <span className="text-[10px] font-semibold tracking-wide uppercase mt-1 opacity-90 group-hover:opacity-100 transition-opacity duration-200">
          Ask Copilot
        </span>
      </button>
    </div>
  );
}
