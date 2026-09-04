import React, { useState, useEffect } from 'react';
import { Sliders, ShieldAlert, Key, Database, RefreshCw, CheckCircle2, RotateCcw, ShieldCheck, Zap, Lock, Bell } from 'lucide-react';
import { resetDemoDataset, fetchAutoFreezePolicy, updateAutoFreezePolicy } from '../services/api';
import { AutoFreezePolicy } from '../types';

interface SettingsPageProps {
  onResetComplete: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onResetComplete }) => {
  const [lowThreshold, setLowThreshold] = useState(30);
  const [medThreshold, setMedThreshold] = useState(60);
  const [highThreshold, setHighThreshold] = useState(80);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Auto-Freeze Policy State
  const [policy, setPolicy] = useState<AutoFreezePolicy>({
    enabled: true,
    min_score_threshold: 80,
    freeze_duration_hours: 24,
    action_type: 'hold_settlement',
    notify_ops: true
  });
  const [policySaving, setPolicySaving] = useState(false);

  useEffect(() => {
    fetchAutoFreezePolicy()
      .then((data) => setPolicy(data))
      .catch((err) => console.error('Failed to load auto freeze policy:', err));
  }, []);

  const handleSavePolicy = async () => {
    try {
      setPolicySaving(true);
      const updated = await updateAutoFreezePolicy(policy);
      setPolicy(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(`Failed to save policy: ${e.message}`);
    } finally {
      setPolicySaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset local db.json database to initial demo baseline?')) return;
    try {
      setIsResetting(true);
      await resetDemoDataset();
      alert('Database reset to clean baseline.');
      onResetComplete();
    } catch (e: any) {
      alert(`Reset failed: ${e.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-extrabold text-[#1b1b23]">
              Rules & System Settings
            </h1>
          </div>
          <p className="text-xs text-[#464554] mt-1">
            Configure autonomous Auto-Freeze Shield policies, deterministic anomaly thresholds, and local persistence.
          </p>
        </div>

        <button
          onClick={handleSavePolicy}
          disabled={policySaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{policySaving ? 'Saving...' : 'Save Rule Configuration'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Auto-Freeze Shield Policy configuration updated successfully!</span>
        </div>
      )}

      {/* 1. Featured Top Card: Autonomous Smart Auto-Freeze Shield Editor */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  Autonomous "Smart Auto-Freeze Shield" Policy Rule Editor
                </h2>
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Autonomous Defense
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically hold settlement payouts and lock high-risk mule accounts when score thresholds are breached.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-300">Auto-Freeze Status:</span>
            <div
              onClick={() => setPolicy({ ...policy, enabled: !policy.enabled })}
              className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                policy.enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              } flex items-center`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </div>
            <span className={`text-xs font-mono font-bold ${policy.enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
              {policy.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>
        </div>

        {/* Policy Editor Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Field 1: Minimum Score Threshold */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-200">Auto-Freeze Score Threshold</label>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                Score ≥ {policy.min_score_threshold}
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={policy.min_score_threshold}
              onChange={(e) => setPolicy({ ...policy, min_score_threshold: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Transactions scoring at or above <strong className="text-white">{policy.min_score_threshold} pts</strong> trigger an instant automated settlement hold.
            </p>
          </div>

          {/* Field 2: Freeze Duration Hours */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-200">Settlement Hold Duration (Hours)</label>
            <div className="flex items-center gap-2">
              {[12, 24, 48, 72].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setPolicy({ ...policy, freeze_duration_hours: hours })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    policy.freeze_duration_hours === hours
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Payouts are locked for <strong className="text-white">{policy.freeze_duration_hours} hours</strong> to give Risk Ops time to complete Section 106 CrPC verification.
            </p>
          </div>

          {/* Field 3: Action Type & Notifications */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-200">Action Execution Mode</label>
            <select
              value={policy.action_type}
              onChange={(e) => setPolicy({ ...policy, action_type: e.target.value as any })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white outline-none cursor-pointer focus:border-blue-500"
            >
              <option value="hold_settlement">Hold Settlement Payout (Recommended)</option>
              <option value="auto_freeze">Freeze Merchant Account & Lock VPA</option>
            </select>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-300 font-medium">Alert Risk Ops Team</span>
              <input
                type="checkbox"
                checked={policy.notify_ops}
                onChange={(e) => setPolicy({ ...policy, notify_ops: e.target.checked })}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Anomaly Scoring Thresholds */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1b1b23] border-b border-slate-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <span>Deterministic Scoring Thresholds (0-100)</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Low Risk Trigger Threshold</span>
                <span className="text-blue-600 font-bold">Score ≥ {lowThreshold}</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={lowThreshold}
                onChange={(e) => setLowThreshold(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Scores below this threshold are automatically marked as Cleared / Normal.
              </p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Medium Risk Threshold</span>
                <span className="text-amber-600 font-bold">Score ≥ {medThreshold}</span>
              </div>
              <input
                type="range"
                min={40}
                max={75}
                value={medThreshold}
                onChange={(e) => setMedThreshold(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>High Risk Anomaly Threshold</span>
                <span className="text-red-600 font-bold">Score ≥ {highThreshold}</span>
              </div>
              <input
                type="range"
                min={70}
                max={95}
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full accent-red-600"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Signal Weights */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1b1b23] border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Signal Weights & False-Positive Guard</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>First-Time Payer (Zero Prior VPA History)</span>
              <strong className="text-blue-600">+20 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Ticket Size Distribution Anomaly</span>
              <strong className="text-blue-600">+20 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Missing Order / Cart Linkage (Orphaned VPA)</span>
              <strong className="text-blue-600">+20 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Rapid Pass-Through Velocity</span>
              <strong className="text-blue-600">+25 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Fractional .99 / .98 Price-Point Heuristic</span>
              <strong className="text-blue-600">+10 pts</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Persistence Reset Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1b1b23]">Local Persistence (db.json)</h3>
            <p className="text-xs text-[#464554]">Reset local file-backed state to initial clean seed data.</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Demo Dataset</span>
        </button>
      </div>
    </div>
  );
};
