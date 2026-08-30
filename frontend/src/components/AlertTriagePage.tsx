import React, { useState } from 'react';
import { RiskFlag, RiskFlagStatus } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  User,
  Hash,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface AlertTriagePageProps {
  flags: RiskFlag[];
  onSelectFlag: (flag: RiskFlag) => void;
  selectedFlagId?: string;
}

export const AlertTriagePage: React.FC<AlertTriagePageProps> = ({
  flags,
  onSelectFlag,
  selectedFlagId
}) => {
  const [filterTab, setFilterTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const counts = {
    all: flags.length,
    needs_review: flags.filter((f) => f.status === 'open' || f.status === 'context_requested').length,
    high: flags.filter((f) => f.confidence_level === 'HIGH').length,
    medium: flags.filter((f) => f.confidence_level === 'MEDIUM').length,
    confirmed: flags.filter((f) => f.status === 'reviewed_confirmed').length,
    cleared: flags.filter((f) => f.status === 'reviewed_dismissed').length,
  };

  const filteredFlags = flags.filter((f) => {
    if (filterTab === 'needs_review' && f.status !== 'open' && f.status !== 'context_requested') return false;
    if (filterTab === 'high' && f.confidence_level !== 'HIGH') return false;
    if (filterTab === 'medium' && f.confidence_level !== 'MEDIUM') return false;
    if (filterTab === 'confirmed' && f.status !== 'reviewed_confirmed') return false;
    if (filterTab === 'cleared' && f.status !== 'reviewed_dismissed') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchVpa = f.payer_vpa.toLowerCase().includes(q);
      const matchAmt = String(f.amount).includes(q);
      const matchOrder = (f.order_id || '').toLowerCase().includes(q);
      const matchSig = f.signals_triggered.some((s) => s.title.toLowerCase().includes(q));
      return matchVpa || matchAmt || matchOrder || matchSig;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#ba1a1a]" />
            <h1 className="text-2xl font-extrabold text-[#1b1b23]">
              Alert Triage & Human Review Queue
            </h1>
          </div>
          <p className="text-xs text-[#464554] mt-1">
            Section 106 CrPC Proactive Defense: Review flagged mule pass-through deposits before account holds occur.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search VPA, amount, signal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1b1b23] placeholder:text-[#767586] focus:outline-none focus:border-[#4648d4] shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Alerts', count: counts.all },
          { id: 'needs_review', label: 'Needs Review', count: counts.needs_review },
          { id: 'high', label: 'High Risk (Score ≥ 80)', count: counts.high, color: 'text-red-700' },
          { id: 'medium', label: 'Medium Risk (Score 60-79)', count: counts.medium, color: 'text-amber-700' },
          { id: 'confirmed', label: 'Confirmed Risk', count: counts.confirmed },
          { id: 'cleared', label: 'Cleared (False Positive)', count: counts.cleared },
        ].map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-[#4648d4] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-[#464554] border border-[#E2E8F0]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive ? 'bg-white text-[#4648d4]' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Flagged Alert Queue Grid */}
      {filteredFlags.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFlags.map((flag) => {
            const isHigh = flag.confidence_level === 'HIGH';
            const isConfirmed = flag.status === 'reviewed_confirmed';
            const isCleared = flag.status === 'reviewed_dismissed';

            return (
              <div
                key={flag.id}
                onClick={() => onSelectFlag(flag)}
                className={`bg-white rounded-2xl p-5 border border-[#E2E8F0] hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between gap-4 shadow-2xs ${
                  isHigh ? 'border-l-4 border-l-[#ba1a1a]' : 'border-l-4 border-l-[#d97706]'
                } ${selectedFlagId === flag.id ? 'ring-2 ring-[#4648d4]' : ''}`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-extrabold text-[#1b1b23]">
                      ₹{flag.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[190px]">{flag.payer_vpa}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isHigh ? 'bg-red-50 text-[#ba1a1a] border border-red-200' : 'bg-amber-50 text-[#d97706] border border-amber-200'
                      }`}
                    >
                      {flag.confidence_score}/100 • {flag.confidence_level}
                    </span>

                    {isConfirmed && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                        Confirmed Risk
                      </span>
                    )}
                    {isCleared && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        Dismissed FP
                      </span>
                    )}
                  </div>
                </div>

                {/* AI Summary / Signals Snippet */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-[#464554] leading-relaxed">
                  <div className="font-semibold text-[#1b1b23] mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#4648d4]" />
                    <span>AI Risk Summary:</span>
                  </div>
                  {flag.ai_summary || flag.ai_explanation || 'Payment flagged due to baseline transaction distribution deviation.'}
                </div>

                {/* Signals Badges & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {flag.signals_triggered.slice(0, 2).map((sig) => (
                      <span key={sig.code} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {sig.title}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFlag(flag);
                    }}
                    className="text-xs font-bold text-[#4648d4] hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Evidence</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mb-2" />
          <h3 className="text-base font-bold text-[#1b1b23]">Queue is Clear</h3>
          <p className="text-xs text-[#464554] max-w-sm mt-1">
            No payments currently match this filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};
