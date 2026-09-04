import React, { useState, useEffect } from 'react';
import {
  Store,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  MoreHorizontal,
  Eye,
  SlidersHorizontal,
  Gavel,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Lock
} from 'lucide-react';
import { Merchant, DashboardSummary, RiskFlag } from '../types';

interface DashboardOverviewProps {
  merchant: Merchant | null;
  summary: DashboardSummary | null;
  flags: RiskFlag[];
  onSelectFlag: (flag: RiskFlag) => void;
  onNavigateToAlerts: () => void;
  onNavigateToSettings: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

type TimeFilterOption = 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'All Time';

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  merchant,
  summary,
  flags,
  onSelectFlag,
  onNavigateToAlerts,
  onNavigateToSettings
}) => {
  // Time Filter Dropdown State
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>('Today');

  // Copy Feedback State
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Calendar State (Default: August 21, 2026)
  const defaultDate = new Date(2026, 7, 21);
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);

  // SVG Gauge Circumference Parameters (r = 45, C = 2 * PI * 45 ≈ 282.74)
  const circumference = 2 * Math.PI * 45;

  // Target Percentages
  const targetExposurePct = summary?.overall_risk_exposure_pct ?? 13.6;
  const targetSettlementPct = summary
    ? Math.min(100, Math.max(0, Math.round(100 - targetExposurePct * 1.2)))
    : 80;

  // Gauge Animation & Decoupled Calibration State
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [currentOffset1, setCurrentOffset1] = useState(circumference);
  const [currentOffset2, setCurrentOffset2] = useState(circumference);

  // Synchronized 3-Phase Tachometer Sweep Animation (0ms -> 400ms -> 800ms)
  useEffect(() => {
    setIsCalibrating(true);
    setCurrentOffset1(circumference);
    setCurrentOffset2(circumference);

    let startTimestamp: number | null = null;
    let animId: number;

    const targetOffset1 = circumference - (circumference * targetExposurePct) / 100;
    const targetOffset2 = circumference - (circumference * targetSettlementPct) / 100;

    const animateGauges = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;

      if (elapsed < 400) {
        // Phase 1 (0ms - 400ms): Fast sweep 0% -> 100% stroke fill (offset: circumference -> 0)
        const p1 = elapsed / 400;
        const easeP1 = 1 - Math.pow(1 - p1, 2); // Fast quadratic ease out
        const fillOffset = circumference * (1 - easeP1);
        setCurrentOffset1(fillOffset);
        setCurrentOffset2(fillOffset);
        animId = requestAnimationFrame(animateGauges);
      } else if (elapsed < 800) {
        // Phase 2 (400ms - 800ms): Smooth return sweep from 100% -> target value
        const p2 = (elapsed - 400) / 400;
        const easeP2 = p2 < 0.5 ? 2 * p2 * p2 : 1 - Math.pow(-2 * p2 + 2, 2) / 2; // Smooth ease in-out
        setCurrentOffset1(targetOffset1 * easeP2);
        setCurrentOffset2(targetOffset2 * easeP2);
        animId = requestAnimationFrame(animateGauges);
      } else {
        // Phase 3 (800ms+): Lock ring at target value & reveal target percentage text from '--'
        setCurrentOffset1(targetOffset1);
        setCurrentOffset2(targetOffset2);
        setIsCalibrating(false);
      }
    };

    animId = requestAnimationFrame(animateGauges);
    return () => cancelAnimationFrame(animId);
  }, [targetExposurePct, targetSettlementPct, circumference]);

  // Copy Handlers
  const handleCopySingle = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`Copied ${label}!`);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleCopyAll = () => {
    const merchantIdStr = (merchant?.id || 'PF5L1TA0').slice(0, 8).toUpperCase();
    const categoryStr = merchant?.business_category || 'Enterprise Fintech';
    const textToCopy = `Merchant ID: ${merchantIdStr}\nGateway Status: ACTIVE\nAPI Version: v2.4.12\nCategory: ${categoryStr}`;
    navigator.clipboard.writeText(textToCopy);
    setCopyFeedback('All Merchant Details Copied!');
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Calendar Navigation
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const currentMonday = getMonday(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + i);
    return d;
  });

  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    setSelectedDate(next);
  };

  const handleResetToday = () => {
    setSelectedDate(defaultDate);
  };

  const handleMonthYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [mName, yStr] = e.target.value.split(' ');
    const mIdx = MONTH_NAMES.indexOf(mName);
    const year = parseInt(yStr, 10);
    if (mIdx !== -1 && !isNaN(year)) {
      const newD = new Date(selectedDate);
      newD.setFullYear(year);
      newD.setMonth(mIdx);
      setSelectedDate(newD);
    }
  };

  // Filter horizontal cards based on timeFilter selection
  const filteredFlags = flags.filter((flag) => {
    if (timeFilter === 'All Time') return true;
    const flagDate = new Date(flag.payment_created_at || flag.created_at);
    const now = new Date();

    if (timeFilter === 'Today') {
      return flagDate.toDateString() === now.toDateString() || true;
    }
    if (timeFilter === 'Yesterday') {
      const yest = new Date();
      yest.setDate(now.getDate() - 1);
      return flagDate.toDateString() === yest.toDateString();
    }
    if (timeFilter === 'Last 7 Days') {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 7);
      return flagDate >= cutoff;
    }
    if (timeFilter === 'Last 30 Days') {
      const cutoff = new Date();
      cutoff.setDate(now.getDate() - 30);
      return flagDate >= cutoff;
    }
    return true;
  });

  const frozenFlags = flags.filter((f) => f.auto_frozen || f.confidence_score >= 80);
  const totalFrozenAmount = frozenFlags.reduce((sum, f) => sum + f.amount, 0);

  const flaggedCount = summary?.total_flagged || flags.length || 4;
  const underReviewCount = summary?.under_review || 2;
  const resolvedCount = summary?.resolved_cleared || 1;

  const merchantIdVal = (merchant?.id || 'PF5L1TA0').slice(0, 8).toUpperCase();
  const merchantCategory = merchant?.business_category || 'Enterprise Fintech';
  const currentMonthYearString = `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* 1. Header Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-[#1b1b23]">
              Hi, {merchant?.name || 'Aura Handcrafted Jewels'}
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Auto-Freeze Shield Active (Score ≥ 80)</span>
            </span>
          </div>
          <p className="text-sm text-[#464554] mt-1">
            Here is the latest live payment monitoring & autonomous defense activity.
          </p>
        </div>
      </div>

      {/* Copy Toast Feedback */}
      {copyFeedback && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-[#1b1b23] text-white text-xs font-bold rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* 2. Top Hero Section Structure (Lenovo Vantage Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Merchant Metadata (Lenovo Vantage Style) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-2xs flex flex-col justify-between">
          <div className="flex gap-5 items-center flex-grow">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
              <Store className="w-10 h-10 text-blue-600" />
            </div>

            <div className="flex-grow flex flex-col gap-2.5">
              {/* Merchant ID */}
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-1.5">
                <span className="text-xs font-medium text-[#464554]">Merchant ID</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1b1b23] font-mono">{merchantIdVal}</span>
                  <button
                    onClick={() => handleCopySingle('Merchant ID', merchantIdVal)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy Merchant ID"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Gateway Status */}
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-1.5">
                <span className="text-xs font-medium text-[#464554]">Gateway Status</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#006c49] animate-pulse"></span>
                  <span className="text-xs font-bold text-[#1b1b23]">ACTIVE</span>
                  <button
                    onClick={() => handleCopySingle('Gateway Status', 'ACTIVE')}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy Gateway Status"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* API Version */}
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-1.5">
                <span className="text-xs font-medium text-[#464554]">API Version</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1b1b23] font-mono">v2.4.12</span>
                  <button
                    onClick={() => handleCopySingle('API Version', 'v2.4.12')}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy API Version"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#464554]">Category</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1b1b23]">{merchantCategory}</span>
                  <button
                    onClick={() => handleCopySingle('Category', merchantCategory)}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy Category"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Copy All Action Button */}
          <div className="flex justify-end mt-4 pt-3 border-t border-[#E2E8F0]">
            <button
              onClick={handleCopyAll}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors"
            >
              <span>Copy all</span>
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Gauge 1: Anomalous Payment Exposure */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-2xs flex flex-col items-center justify-center text-center relative">
          <button
            onClick={onNavigateToSettings}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
            title="Settings"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Tachometer SVG Gauge Ring */}
          <div className="relative w-32 h-32 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="#E2E8F0"
                strokeWidth="8"
              />
              {/* Animated Foreground Arc */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="#ba1a1a"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={currentOffset1}
              />
            </svg>

            {/* Inner Center Icon & Static Placeholder '--' or Final Percentage Reveal */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] mb-0.5" />
              {isCalibrating ? (
                <span className="text-xl font-extrabold text-[#767586] font-mono tracking-widest">
                  --
                </span>
              ) : (
                <span className="text-xl font-extrabold text-[#1b1b23] animate-in fade-in zoom-in-95 duration-200">
                  {targetExposurePct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          <h3 className="font-bold text-xs text-[#1b1b23] mb-0.5">Anomalous Exposure</h3>
          <p className="text-[10px] text-[#464554] font-medium">Real-time monitoring active</p>
        </div>

        {/* Gauge 2: Settlement Volume */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-2xs flex flex-col items-center justify-center text-center relative">
          <button
            onClick={onNavigateToSettings}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
            title="Settings"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Tachometer SVG Gauge Ring */}
          <div className="relative w-32 h-32 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track Circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="#E2E8F0"
                strokeWidth="8"
              />
              {/* Animated Foreground Arc */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke="#006c49"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={currentOffset2}
              />
            </svg>

            {/* Inner Center Icon & Static Placeholder '--' or Final Percentage Reveal */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#006c49] mb-0.5" />
              {isCalibrating ? (
                <span className="text-xl font-extrabold text-[#767586] font-mono tracking-widest">
                  --
                </span>
              ) : (
                <span className="text-xl font-extrabold text-[#1b1b23] animate-in fade-in zoom-in-95 duration-200">
                  {targetSettlementPct}%
                </span>
              )}
            </div>
          </div>

          <h3 className="font-bold text-xs text-[#1b1b23] mb-0.5">Settlement Volume</h3>
          <p className="text-[10px] text-[#4648d4] font-bold">Daily target: 90%</p>
        </div>
      </div>

      {/* 3. Middle Grid (Left Card 8 Cols, Right Card 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Main Focus */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col gap-6">
          {/* Subheader & Horizontal Flagged Cards List */}
          <div className="flex flex-col gap-4 flex-grow">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#1b1b23]">Flagged Transactions:</h3>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full border border-[#E2E8F0] text-[#464554] text-xs font-medium flex items-center gap-2 bg-surface">
                  <span className="w-2 h-2 rounded-full bg-[#d97706]"></span> In Progress {String(underReviewCount).padStart(2, '0')}
                </span>

                {/* Interactive Time Filter Dropdown */}
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilterOption)}
                  className="px-3 py-1 rounded-full border border-[#E2E8F0] text-[#464554] text-xs font-semibold bg-surface hover:bg-slate-50 focus:outline-none cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="All Time">All Time</option>
                </select>
              </div>
            </div>

            {/* Horizontal Scrollable Flagged Cards */}
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
              {filteredFlags.slice(0, 4).map((flag, idx) => {
                const isHigh = flag.confidence_level === 'HIGH';
                const avatar = idx === 0 ? 'UP' : idx === 1 ? 'OB' : 'TX';
                const dotColor = isHigh ? 'bg-[#ba1a1a]' : 'bg-[#d97706]';
                const leftBorder = isHigh ? 'border-l-4 border-l-[#ba1a1a]' : '';

                return (
                  <div
                    key={flag.id}
                    onClick={() => onSelectFlag(flag)}
                    className={`min-w-[280px] max-w-[300px] bg-white rounded-xl p-4 border border-[#E2E8F0] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${leftBorder}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-[#1b1b23] text-sm">
                          ₹{flag.amount.toLocaleString('en-IN')} {idx === 0 ? 'Unknown Payer' : idx === 1 ? 'Off-Hours Bulk' : 'Pass-Through'}
                        </h4>
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></span>
                      </div>
                      <p className="text-xs text-[#464554] line-clamp-2 leading-relaxed mb-4">
                        {flag.ai_summary || flag.ai_explanation || 'VPA Mismatch. Suspicious pattern detected based on recent volume.'}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {avatar}
                        </div>
                        <span className="text-[11px] text-[#464554] font-medium">
                          Confidence: {flag.confidence_score}/100
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isHigh
                            ? 'bg-[#ba1a1a] text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {isHigh ? 'High Risk' : 'Medium Risk'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* View All Pending Card */}
              <div
                onClick={onNavigateToAlerts}
                className="min-w-[240px] bg-white rounded-xl p-4 border border-dashed border-[#c7c4d7] flex flex-col items-center justify-center text-[#464554] hover:text-blue-600 hover:border-blue-600 cursor-pointer transition-colors"
              >
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">View All Pending</span>
              </div>
            </div>

            {/* 🧊 Auto-Frozen Payouts & Settlement Holds Queue */}
            <div className="mt-4 pt-4 border-t border-rose-100 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Auto-Frozen Payouts & Settlement Holds ({frozenFlags.length})
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span> Total Locked: ₹{totalFrozenAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {frozenFlags.length > 0 ? (
                <div className="divide-y divide-rose-100 rounded-xl border border-rose-200 bg-rose-50/30 overflow-hidden">
                  {frozenFlags.slice(0, 5).map((f) => (
                    <div key={f.id} className="p-3 flex items-center justify-between text-xs bg-white hover:bg-rose-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                          🧊
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>₹{f.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            {f.order_id && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                {f.order_id}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-mono">
                              {f.confidence_score}/100 HIGH Risk
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">Payer VPA: {f.payer_vpa} • Hold status: Settlement Lock (24h)</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectFlag(f)}
                          className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" /> Inspect Hold
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No payouts currently auto-frozen. Autonomous Smart Shield will lock settlement payouts automatically for risk scores ≥ 80.
                </div>
              )}
            </div>

            {/* Authorized / Clean / Good Payments List Queue */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Authorized / Clean Payments List ({flags.filter(f => f.status === 'dismissed' || f.status === 'reviewed_dismissed').length})
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Auto-Verified & Dismissed
                </span>
              </div>

              {flags.filter(f => f.status === 'dismissed' || f.status === 'reviewed_dismissed').length > 0 ? (
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                  {flags
                    .filter(f => f.status === 'dismissed' || f.status === 'reviewed_dismissed')
                    .slice(0, 5)
                    .map((f) => (
                      <div key={f.id} className="p-3 flex items-center justify-between text-xs bg-white hover:bg-emerald-50/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                            ✓
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>₹{f.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              {f.order_id && (
                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                                  {f.order_id}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">{f.payer_vpa}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Authorized / Cleared
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(f.payment_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  No dismissed false positive payments in queue yet. Click "Dismiss as False Positive" on any alert to route it here immediately.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Activity, Stats & Calendar Strip */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex-grow flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1b1b23] mb-1">
                Latest on Your Payments & Mule Signals
              </h3>
              <p className="text-xs text-[#464554] mb-6">
                Everything moving across your processing, at a glance.
              </p>

              {/* 4 Stats Column */}
              <div className="grid grid-cols-4 gap-2 mb-6 border-b border-[#E2E8F0] pb-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-[#1b1b23]">
                    {String(flaggedCount).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-[#464554] font-medium uppercase">Flagged</span>
                </div>
                <div className="flex flex-col border-l border-[#E2E8F0] pl-2">
                  <span className="text-2xl font-bold text-[#1b1b23]">
                    {String(resolvedCount).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-[#464554] font-medium uppercase">Cleared</span>
                </div>
                <div className="flex flex-col border-l border-[#E2E8F0] pl-2">
                  <span className="text-2xl font-bold text-[#1b1b23]">
                    {String(underReviewCount).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-[#464554] font-medium uppercase">In-Progress</span>
                </div>
                <div className="flex flex-col border-l border-[#E2E8F0] pl-2">
                  <span className="text-2xl font-bold text-[#1b1b23]">00</span>
                  <span className="text-[10px] text-[#464554] font-medium uppercase">Frozen</span>
                </div>
              </div>

              {/* Interactive Calendar Header */}
              <div className="mb-4 flex items-center justify-between">
                {/* Month/Year Picker Dropdown */}
                <select
                  value={currentMonthYearString}
                  onChange={handleMonthYearChange}
                  className="px-3 py-1 rounded-lg border border-[#E2E8F0] text-[#464554] text-xs font-semibold bg-white focus:outline-none cursor-pointer"
                >
                  <option value="June 2026">June 2026</option>
                  <option value="July 2026">July 2026</option>
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                </select>

                {/* Calendar Navigation Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevWeek}
                    title="Previous Week"
                    className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNextWeek}
                    title="Next Week"
                    className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResetToday}
                    title="Reset to Active Date"
                    className="px-2 py-0.5 rounded bg-[#4648d4] hover:bg-[#3739B0] text-white text-[10px] font-bold ml-1 transition-colors"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Functional Date Strip: Weekdays for selectedDate */}
              <div className="flex justify-between text-[#464554] text-[10px] font-bold mb-6 px-1">
                {weekDays.map((dayDate, idx) => {
                  const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(dayDate)}
                      className={`text-center w-8 cursor-pointer ${isSelected ? 'text-[#4648d4] font-bold' : ''}`}
                    >
                      {dayLabels[idx]}
                      <br />
                      {isSelected ? (
                        <span className="bg-[#4648d4] text-white rounded-full w-5 h-5 flex items-center justify-center mx-auto mt-0.5 shadow-2xs text-xs font-bold">
                          {dayDate.getDate()}
                        </span>
                      ) : (
                        <span className="text-[#1b1b23] text-xs font-medium hover:text-[#4648d4]">
                          {dayDate.getDate()}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Progress Items */}
            <div className="flex flex-col gap-3">
              {/* Item 1: Daily Volume Check */}
              <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase text-[#464554]">
                    Transaction Monitoring
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#6cf8bb]/30 text-[#00714d] text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span> On Track
                  </span>
                </div>
                <h4 className="font-bold text-[#1b1b23] text-xs mb-1.5">Daily Volume Check</h4>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#006c49] h-full w-[75%] rounded-full"></div>
                </div>
              </div>

              {/* Item 2: Alert Triage */}
              <div className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E2E8F0] border-l-2 border-l-[#ba1a1a]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase text-[#464554]">
                    Alert Triage
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#93000a] text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span> Action Needed
                  </span>
                </div>
                <h4 className="font-bold text-[#1b1b23] text-xs mb-1.5">Review High-Risk Mules</h4>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#ba1a1a] h-full w-[20%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Dual Cards (This Week Glance & Issues Evidence) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Health Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1b1b23] mb-1">This Week Glance:</h3>
            <p className="text-xs text-[#464554] mb-4">Aug 12 - 17</p>

            <div className="space-y-2">
              <h4 className="font-bold text-[#1b1b23] text-xs">System Health:</h4>
              <p className="text-xs text-[#464554] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Check className="w-3 h-3" />
                </span>
                All monitoring systems nominal. Deterministic scoring rule engine active.
              </p>
            </div>
          </div>
        </div>

        {/* Issues / Anomaly Evidence Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-[#1b1b23]">Issues / Anomaly Evidence:</h3>
            <button
              onClick={onNavigateToAlerts}
              className="px-3 py-1 rounded-full bg-[#6cf8bb]/30 text-[#00714d] text-[10px] font-bold hover:bg-[#6cf8bb]/50 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-1">
              <span className="font-bold text-[#1b1b23] text-xs">
                Payer VPA zero prior history
              </span>
              <span className="text-[10px] text-[#464554]">
                12 Days ago - Alert ID #892
              </span>
            </div>
            <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-1">
              <span className="font-bold text-[#1b1b23] text-xs">
                Missing order reference on public UPI QR collect
              </span>
              <span className="text-[10px] text-[#464554]">
                Today - Alert ID #890
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
