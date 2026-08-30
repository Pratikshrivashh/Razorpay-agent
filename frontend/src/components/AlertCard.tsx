import React from 'react';
import { RiskFlag, RiskFlagStatus } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, ChevronRight, User, Hash } from 'lucide-react';

interface AlertCardProps {
  flag: RiskFlag;
  onSelect: (flag: RiskFlag) => void;
  isSelected?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({ flag, onSelect, isSelected }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          border: 'border-l-4 border-l-red-500',
          badgeBg: 'bg-red-50 text-red-700 border-red-200',
          dotBg: 'bg-red-500',
          badgeText: 'High Risk'
        };
      case 'MEDIUM':
        return {
          border: 'border-l-4 border-l-amber-500',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          dotBg: 'bg-amber-500',
          badgeText: 'Medium Risk'
        };
      default:
        return {
          border: 'border-l-4 border-l-blue-500',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          dotBg: 'bg-blue-500',
          badgeText: 'Low Risk'
        };
    }
  };

  const getStatusBadge = (status: RiskFlagStatus) => {
    switch (status) {
      case 'reviewed_confirmed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            <span>Confirmed Risk</span>
          </span>
        );
      case 'reviewed_dismissed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Dismissed (Safe)</span>
          </span>
        );
      case 'context_requested':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-600" />
            <span>Context Requested</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Needs Review</span>
          </span>
        );
    }
  };

  const risk = getRiskColor(flag.confidence_level);
  const timeFormatted = new Date(flag.payment_created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div
      onClick={() => onSelect(flag)}
      className={`bg-surface rounded-xl p-4 card-border card-border-hover transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-3 ${
        risk.border
      } ${isSelected ? 'ring-2 ring-primary border-primary bg-indigo-50/20' : ''}`}
    >
      {/* Top Header: Amount, Time & Risk Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-slate-900">
              ₹{flag.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{timeFormatted}</span>
          </div>
          <div className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[200px]">{flag.payer_vpa}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${risk.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${risk.dotBg}`}></span>
            <span>{risk.badgeText} ({flag.confidence_score}/100)</span>
          </span>
          {getStatusBadge(flag.status)}
        </div>
      </div>

      {/* AI Summary / Reason Snippet */}
      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
        {flag.ai_summary || flag.ai_explanation || 'Payment flagged due to baseline transaction distribution deviation.'}
      </p>

      {/* Triggered Signal Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
        {flag.signals_triggered.slice(0, 3).map((sig) => (
          <span
            key={sig.code}
            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium truncate max-w-[170px]"
            title={sig.title}
          >
            {sig.title}
          </span>
        ))}
        {flag.signals_triggered.length > 3 && (
          <span className="text-[10px] text-slate-500 font-semibold">
            +{flag.signals_triggered.length - 3} more
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 text-primary text-xs font-semibold hover:underline">
          <span>Inspect Evidence</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
