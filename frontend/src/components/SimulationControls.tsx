import React, { useState } from 'react';
import { Play, Plus, RefreshCw, Zap, Moon, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { injectMulePattern, generateDemoTraffic, resetDemoDataset } from '../services/api';

interface SimulationControlsProps {
  merchantId?: string;
  onSimulationComplete: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  merchantId,
  onSimulationComplete
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleInjectMule = async (patternType: string, label: string) => {
    try {
      setLoadingAction(patternType);
      const res = await injectMulePattern(merchantId, patternType);
      showStatus(`Injected "${label}"! Flagged with Anomaly Score: ${res.flag?.confidence_score || 'N/A'}/100`, 'success');
      onSimulationComplete();
    } catch (e: any) {
      showStatus(`Injection failed: ${e.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateTraffic = async () => {
    try {
      setLoadingAction('generate_traffic');
      const res = await generateDemoTraffic(merchantId, 50, 4, false);
      showStatus(`Generated 50 normal transactions + 4 planted mule patterns! Model Precision: ${res.evaluation_metrics?.precision_pct}%`, 'success');
      onSimulationComplete();
    } catch (e: any) {
      showStatus(`Generation failed: ${e.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all transactions and audit history?')) return;
    try {
      setLoadingAction('reset');
      await resetDemoDataset();
      showStatus('Database reset to clean baseline state.', 'info');
      onSimulationComplete();
    } catch (e: any) {
      showStatus(`Reset failed: ${e.message}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-surface rounded-xl p-4 card-border shadow-sm flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Live Simulation & Mule Pattern Injection
          </span>
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
            Demo Controller
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateTraffic}
            disabled={loadingAction !== null}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Generate 50+ Traffic</span>
          </button>
          <button
            onClick={handleReset}
            disabled={loadingAction !== null}
            className="px-3 py-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Quick Injection Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-medium mr-1">Inject Live Anomaly:</span>

        {/* Pattern 1: Flat ₹550 Task App */}
        <button
          onClick={() => handleInjectMule('task_app_round_deposit', 'Task App ₹550')}
          disabled={loadingAction !== null}
          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Task-App Deposit (₹550 Unlinked)</span>
          {loadingAction === 'task_app_round_deposit' && <RefreshCw className="w-3 h-3 animate-spin" />}
        </button>

        {/* Pattern 2: Nocturnal Burst */}
        <button
          onClick={() => handleInjectMule('off_hours_burst', 'Off-Hours Nocturnal')}
          disabled={loadingAction !== null}
          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <Moon className="w-3.5 h-3.5 text-red-600" />
          <span>Off-Hours Burst (03:30 AM)</span>
          {loadingAction === 'off_hours_burst' && <RefreshCw className="w-3 h-3 animate-spin" />}
        </button>

        {/* Pattern 3: Pass-Through Cycle */}
        <button
          onClick={() => handleInjectMule('pass_through_cycle', 'Pass-Through Cycle')}
          disabled={loadingAction !== null}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Pass-Through Cycle (₹4,800)</span>
          {loadingAction === 'pass_through_cycle' && <RefreshCw className="w-3 h-3 animate-spin" />}
        </button>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-slate-100 text-slate-800 border border-slate-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold hover:underline">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
