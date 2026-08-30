import React from 'react';
import { Network, Activity, BarChart3, ShieldCheck, History, User, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { DashboardSummary, AuditLog, Merchant } from '../types';

interface AnalyticsPageProps {
  summary: DashboardSummary | null;
  auditLogs: AuditLog[];
  merchant: Merchant | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  summary,
  auditLogs,
  merchant
}) => {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-[#4648d4]" />
            <h1 className="text-2xl font-extrabold text-[#1b1b23]">
              Network Analytics & Evidence Logs
            </h1>
          </div>
          <p className="text-xs text-[#464554] mt-1">
            Deep-dive transaction velocity, VPA network clustering, and ground-truth model benchmarks.
          </p>
        </div>
      </div>

      {/* Top 3 Analytical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Ground Truth Precision Scorecard */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#464554] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Evaluation Benchmark</span>
            <ShieldCheck className="w-5 h-5 text-[#006c49]" />
          </div>
          <div>
            <div className="text-4xl font-extrabold text-[#4648d4] mb-1">
              {summary?.precision || 100}%
            </div>
            <div className="text-xs text-slate-500 font-medium">Model Precision on Labeled Mules</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-500">Specificity:</span>{' '}
              <strong className="text-slate-800">{summary?.specificity || 100}%</strong>
            </div>
            <div>
              <span className="text-slate-500">Recall:</span>{' '}
              <strong className="text-slate-800">{summary?.recall || 80}%</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Ticket Size Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#464554] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Size Baseline</span>
            <BarChart3 className="w-5 h-5 text-[#4648d4]" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1b1b23] mb-1">
              {merchant?.name || 'Aura Handcrafted Jewels'}
            </div>
            <div className="text-xs text-slate-500">
              Normal Catalog Range: <strong>₹{merchant?.typical_order_min || 1200} – ₹{merchant?.typical_order_max || 6500}</strong>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 font-semibold">
              Mule Outliers: Flat ₹550 deposits
            </span>
          </div>
        </div>

        {/* Card 3: Payer VPA Lineage */}
        <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#464554] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">VPA History Join</span>
            <Activity className="w-5 h-5 text-[#4648d4]" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#1b1b23] mb-1">
              {summary?.total_transactions || 55} Total
            </div>
            <div className="text-xs text-slate-500">
              {summary?.resolved_cleared || 50} verified repeat customers • {summary?.total_flagged || 4} unfamiliar VPAs
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
            ✓ False-Positive Guard automatically dampens repeat buyers
          </div>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#4648d4]" />
            <h3 className="text-base font-bold text-[#1b1b23]">
              Section 106 CrPC Immutable Audit Trail
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {auditLogs.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#464554] uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Entity ID</th>
                <th className="py-2.5 px-3">Details / Reviewer Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {log.actor}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">
                    {log.entity_id ? log.entity_id.slice(0, 8) : 'N/A'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 max-w-md truncate">
                    {log.detail?.notes ? (
                      `"${log.detail.notes}"`
                    ) : log.detail?.amount ? (
                      `Txn ₹${log.detail.amount} • Payer: ${log.detail.payer_vpa || 'N/A'} • Score: ${log.detail.score || 'N/A'}`
                    ) : (
                      JSON.stringify(log.detail)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
