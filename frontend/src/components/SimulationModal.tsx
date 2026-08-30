import React, { useState } from 'react';
import { X, Zap, Play, Moon, AlertTriangle, RefreshCw, Send, ShieldAlert, DollarSign } from 'lucide-react';
import { injectMulePattern, injectCustomMulePattern, generateDemoTraffic } from '../services/api';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantId?: string;
  onSimulationComplete: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  merchantId,
  onSimulationComplete
}) => {
  if (!isOpen) return null;

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Local state for custom simulation injection
  const [customAmount, setCustomAmount] = useState<string>('199.99');
  const [customVpa, setCustomVpa] = useState<string>('task_job_99@ybl');
  const [customPattern, setCustomPattern] = useState<string>('fractional_task_scam');

  const handleInject = async (patternType: string, label: string) => {
    try {
      setLoadingAction(patternType);
      const res = await injectMulePattern(merchantId, patternType);
      setResultMessage(`Injected "${label}"! Flagged with Anomaly Score: ${res.flag?.confidence_score || 'N/A'}/100`);
      onSimulationComplete();
    } catch (e: any) {
      alert(`Injection error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInjectCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAmount || !customVpa) return;

    try {
      setLoadingAction('custom');
      const amountNum = parseFloat(customAmount);
      const res = await injectCustomMulePattern(merchantId, amountNum, customVpa, customPattern);
      setResultMessage(`⚡ Custom Event Injected: ₹${amountNum.toLocaleString('en-IN')} from ${customVpa}! Score: ${res.flag?.confidence_score || 'N/A'}/100`);
      onSimulationComplete();
    } catch (e: any) {
      alert(`Custom injection error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoadingAction('generate');
      const res = await generateDemoTraffic(merchantId, 50, 6, false);
      setResultMessage(`Generated 50 normal transactions + 6 planted 12-signal mules! Precision: ${res.evaluation_metrics?.precision_pct}%`);
      onSimulationComplete();
    } catch (e: any) {
      alert(`Generation error: ${e.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                12-Signal Mule Simulator Engine
              </h3>
              <p className="text-[11px] text-slate-500">
                Trigger real-time webhook payloads to test Sentinel's detection rules.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Preset 12-Signal Patterns */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              12-Signal Mule Attack Scenarios
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Pattern 1: Fractional .99 Task Scam */}
              <div
                onClick={() => handleInject('fractional_task_scam', 'Fractional .99 Task Scam')}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>Fractional .99 Task Scam</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">₹199.99</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Category 1: Fractional decimal signature (.99/.98)</div>
                  </div>
                </div>

                {loadingAction === 'fractional_task_scam' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <button className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold px-3 py-1.5 transition-colors shadow-2xs">
                    Inject
                  </button>
                )}
              </div>

              {/* Pattern 2: USDT Crypto Off-Ramp */}
              <div
                onClick={() => handleInject('usdt_p2p_offramp', 'USDT P2P Crypto Off-Ramp')}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>USDT P2P Crypto Off-Ramp</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">₹8,500.00</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Category 2: Immediate pass-through velocity & OTC off-ramp</div>
                  </div>
                </div>

                {loadingAction === 'usdt_p2p_offramp' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <button className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold px-3 py-1.5 transition-colors shadow-2xs">
                    Inject
                  </button>
                )}
              </div>

              {/* Pattern 3: Structuring / Smurfing Deposit */}
              <div
                onClick={() => handleInject('smurfing_structuring', 'Structuring / Smurfing Deposit')}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>Structuring / Smurfing Deposit</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">₹9,990.00</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Category 1: Kept intentionally under ₹10k reporting limit</div>
                  </div>
                </div>

                {loadingAction === 'smurfing_structuring' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <button className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold px-3 py-1.5 transition-colors shadow-2xs">
                    Inject
                  </button>
                )}
              </div>

              {/* Pattern 4: Fresh Mule Shell Entity */}
              <div
                onClick={() => handleInject('fresh_mule_shell', 'Fresh Mule Shell Entity')}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>Fresh Mule Shell Entity</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">₹3,499.99</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Category 4: Fresh GSTIN/domain & 0-refund anomaly</div>
                  </div>
                </div>

                {loadingAction === 'fresh_mule_shell' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <button className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold px-3 py-1.5 transition-colors shadow-2xs">
                    Inject
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Custom Injection Form */}
          <form onSubmit={handleInjectCustom} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Custom Amount & Payer VPA Input</span>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                Custom Payload
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="199.99"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Payer VPA
                </label>
                <input
                  type="text"
                  value={customVpa}
                  onChange={(e) => setCustomVpa(e.target.value)}
                  placeholder="task_job_99@ybl"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <select
                value={customPattern}
                onChange={(e) => setCustomPattern(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="fractional_task_scam">Fractional .99 Task Scam</option>
                <option value="usdt_p2p_offramp">USDT P2P Crypto Off-Ramp</option>
                <option value="smurfing_structuring">Structuring / Smurfing</option>
                <option value="micro_deposit_burst">Micro-Deposit Velocity Burst</option>
                <option value="overnight_clearing_sweep">Overnight Clearing Sweep</option>
                <option value="fresh_mule_shell">Fresh Mule Shell Entity</option>
              </select>

              <button
                type="submit"
                disabled={loadingAction !== null}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
              >
                {loadingAction === 'custom' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>⚡ Inject Custom Event</span>
              </button>
            </div>
          </form>

          {/* Background Traffic Generator */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleGenerate}
              disabled={loadingAction !== null}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Generate 50+ Traffic (12-Signal Dataset)</span>
            </button>
          </div>

          {resultMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-in fade-in duration-150">
              {resultMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
