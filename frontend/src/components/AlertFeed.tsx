import React, { useState } from 'react';
import { RiskFlag } from '../types';
import { AlertCard } from './AlertCard';
import { Search, Filter, ShieldCheck, AlertCircle } from 'lucide-react';

interface AlertFeedProps {
  flags: RiskFlag[];
  onSelectFlag: (flag: RiskFlag) => void;
  selectedFlagId?: string;
}

export const AlertFeed: React.FC<AlertFeedProps> = ({
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
    // Tab filter
    if (filterTab === 'needs_review' && f.status !== 'open' && f.status !== 'context_requested') return false;
    if (filterTab === 'high' && f.confidence_level !== 'HIGH') return false;
    if (filterTab === 'medium' && f.confidence_level !== 'MEDIUM') return false;
    if (filterTab === 'confirmed' && f.status !== 'reviewed_confirmed') return false;
    if (filterTab === 'cleared' && f.status !== 'reviewed_dismissed') return false;

    // Search filter
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
    <div className="bg-surface rounded-xl p-5 card-border shadow-sm flex flex-col gap-4">
      {/* Feed Header: Title, Search, and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Flagged Mule Pattern Queue</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {filteredFlags.length} of {flags.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time suspicious payment events requiring Razorpay human verification.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search VPA, amount, signal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-subtle border border-border rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'all', label: 'All Alerts', count: counts.all },
          { id: 'needs_review', label: 'Needs Review', count: counts.needs_review, highlight: true },
          { id: 'high', label: 'High Risk', count: counts.high, color: 'text-red-700' },
          { id: 'medium', label: 'Medium Risk', count: counts.medium, color: 'text-amber-700' },
          { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
          { id: 'cleared', label: 'Cleared (FP)', count: counts.cleared },
        ].map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-surface-subtle hover:bg-slate-200/70 text-slate-600 border border-border'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alert Cards Grid */}
      {filteredFlags.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 mt-2">
          {filteredFlags.map((flag) => (
            <AlertCard
              key={flag.id}
              flag={flag}
              onSelect={onSelectFlag}
              isSelected={selectedFlagId === flag.id}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-border rounded-xl bg-slate-50/50">
          <ShieldCheck className="w-10 h-10 text-emerald-500" />
          <div className="text-sm font-bold text-slate-800">No Flagged Transactions in View</div>
          <p className="text-xs text-slate-500 max-w-sm">
            All transaction streams for this filter are currently clear and operating within normal merchant parameters.
          </p>
        </div>
      )}
    </div>
  );
};
