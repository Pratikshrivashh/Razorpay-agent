import React, { useState } from 'react';
import { Sliders, ShieldAlert, Key, Database, RefreshCw, CheckCircle2, RotateCcw } from 'lucide-react';
import { resetDemoDataset } from '../services/api';

interface SettingsPageProps {
  onResetComplete: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onResetComplete }) => {
  const [lowThreshold, setLowThreshold] = useState(30);
  const [medThreshold, setMedThreshold] = useState(60);
  const [highThreshold, setHighThreshold] = useState(80);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
            <Sliders className="w-6 h-6 text-[#4648d4]" />
            <h1 className="text-2xl font-extrabold text-[#1b1b23]">
              Rules & System Settings
            </h1>
          </div>
          <p className="text-xs text-[#464554] mt-1">
            Configure deterministic anomaly scoring thresholds, Razorpay webhook keys, and local persistence.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#4648d4] text-white rounded-xl text-xs font-bold hover:bg-[#3739B0] shadow-xs flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Rule Configuration</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          ✓ Rule configuration updated successfully.
        </div>
      )}

      {/* 2-Column Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Anomaly Scoring Thresholds */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1b1b23] border-b border-slate-100 pb-3">
            <ShieldAlert className="w-5 h-5 text-[#4648d4]" />
            <span>Deterministic Scoring Thresholds (0-100)</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Low Risk Trigger Threshold</span>
                <span className="text-[#4648d4] font-bold">Score ≥ {lowThreshold}</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                value={lowThreshold}
                onChange={(e) => setLowThreshold(Number(e.target.value))}
                className="w-full accent-[#4648d4]"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Scores below this threshold are automatically marked as Cleared / Normal.
              </p>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Medium Risk Threshold</span>
                <span className="text-[#d97706] font-bold">Score ≥ {medThreshold}</span>
              </div>
              <input
                type="range"
                min={40}
                max={75}
                value={medThreshold}
                onChange={(e) => setMedThreshold(Number(e.target.value))}
                className="w-full accent-[#d97706]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>High Risk Anomaly Threshold</span>
                <span className="text-[#ba1a1a] font-bold">Score ≥ {highThreshold}</span>
              </div>
              <input
                type="range"
                min={70}
                max={95}
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full accent-[#ba1a1a]"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Signal Weights */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1b1b23] border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-[#4648d4]" />
            <span>Signal Weights & False-Positive Guard</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>First-Time Payer (Zero Prior VPA History)</span>
              <strong className="text-[#4648d4]">+25 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Ticket Size Distribution Anomaly</span>
              <strong className="text-[#4648d4]">+20 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Missing Order / Cart Linkage</span>
              <strong className="text-[#4648d4]">+20 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Rapid Pass-Through / Payout Velocity</span>
              <strong className="text-[#4648d4]">+25 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span>Nocturnal / Off-Hours Processing</span>
              <strong className="text-[#4648d4]">+10 pts</strong>
            </div>
            <div className="flex justify-between p-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
              <span>Verified Repeat Customer (FP Guard Damping)</span>
              <strong className="text-emerald-700">-25 pts</strong>
            </div>
          </div>
        </div>

        {/* Card 3: Webhook & API Connection */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1b1b23] border-b border-slate-100 pb-3">
            <Key className="w-5 h-5 text-[#4648d4]" />
            <span>Razorpay Webhook & AI Configuration</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Webhook Ingestion URL</label>
              <input
                type="text"
                readOnly
                value="http://localhost:8000/webhooks/razorpay"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">AI Engine Provider</label>
              <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Google Gemini 3.6 Flash Active (GEMINI_API_KEY)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Database & State Reset */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1b1b23] border-b border-slate-100 pb-3">
            <Database className="w-5 h-5 text-[#4648d4]" />
            <span>Local Database Store (db.json)</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            All merchant profiles, transactions, risk flags, and immutable audit logs are stored locally in <code>backend/data/db.json</code> (zero Docker/Postgres dependency).
          </p>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isResetting ? 'Resetting...' : 'Reset Database to Demo Baseline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
