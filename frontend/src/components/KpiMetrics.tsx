import React from 'react';
import { DashboardSummary } from '../types';
import { ShieldAlert, Clock, CheckCircle2, AlertTriangle, Target, Gauge } from 'lucide-react';

interface KpiMetricsProps {
  summary: DashboardSummary | null;
  merchantName?: string;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ summary, merchantName }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Overall Risk Exposure Card */}
      <div className="bg-surface rounded-xl p-4 card-border shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Risk Exposure</span>
          <Gauge className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-extrabold ${
            summary.overall_risk_exposure_pct > 25 ? 'text-amber-600' : 'text-slate-900'
          }`}>
            {summary.overall_risk_exposure_pct}%
          </span>
          <span className="text-xs text-slate-500 font-medium">of total txns</span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              summary.overall_risk_exposure_pct > 30 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, summary.overall_risk_exposure_pct))}%` }}
          ></div>
        </div>
      </div>

      {/* 2. Total Flagged Transactions */}
      <div className="bg-surface rounded-xl p-4 card-border shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Flagged Anomaly</span>
          <ShieldAlert className="w-4 h-4 text-red-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-red-600">
            {String(summary.total_flagged).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500">Mule Alerts</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
          <span className="font-semibold text-slate-700">{summary.confirmed_risks}</span> confirmed risk
        </div>
      </div>

      {/* 3. Under Human Review */}
      <div className="bg-surface rounded-xl p-4 card-border shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Under Review</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-600">
            {String(summary.under_review).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500">Pending Action</span>
        </div>
        <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-center mt-2 font-medium">
          Human Sign-Off Required
        </div>
      </div>

      {/* 4. Resolved / Cleared */}
      <div className="bg-surface rounded-xl p-4 card-border shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Cleared / FP</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-600">
            {String(summary.resolved_cleared).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-500">Dismissed</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          FP Rate: <span className="font-semibold text-slate-700">{summary.false_positive_rate_pct}%</span>
        </div>
      </div>

      {/* 5. Synthetic Precision & Specificity Benchmark */}
      <div className="bg-surface rounded-xl p-4 card-border shadow-sm flex flex-col justify-between bg-gradient-to-br from-slate-50 to-indigo-50/40">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Model Precision</span>
          <Target className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-primary">
            {summary.precision}%
          </span>
          <span className="text-xs text-slate-500">Precision</span>
        </div>
        <div className="text-[11px] text-slate-600 mt-2 flex justify-between">
          <span>Specificity: <strong className="text-slate-800">{summary.specificity}%</strong></span>
          <span>Recall: <strong className="text-slate-800">{summary.recall}%</strong></span>
        </div>
      </div>
    </div>
  );
};
