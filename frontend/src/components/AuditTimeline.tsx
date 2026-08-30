import React from 'react';
import { AuditLog } from '../types';
import { History, ShieldAlert, CheckCircle2, Bot, User, Clock, AlertCircle } from 'lucide-react';

interface AuditTimelineProps {
  logs: AuditLog[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  const getActionBadge = (action: string) => {
    if (action.includes('CONFIRM')) {
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        icon: ShieldAlert,
        label: 'Risk Confirmed'
      };
    }
    if (action.includes('DISMISS')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        label: 'False Positive Dismissed'
      };
    }
    if (action.includes('CONTEXT')) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: Clock,
        label: 'Context Requested'
      };
    }
    if (action.includes('SCORED_AND_FLAGGED')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: AlertCircle,
        label: 'Anomaly Flagged'
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: History,
      label: action.replace(/_/g, ' ')
    };
  };

  return (
    <div className="bg-surface rounded-xl p-5 card-border shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900">Immutable Audit Trail & Activity Log</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Section 106 CrPC Defense Trail
        </span>
      </div>

      {logs.length > 0 ? (
        <div className="space-y-3">
          {logs.map((log) => {
            const badge = getActionBadge(log.action);
            const Icon = badge.icon;
            const formattedTime = new Date(log.timestamp).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            return (
              <div
                key={log.id}
                className="p-3 bg-surface-subtle rounded-xl card-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface card-border text-slate-700 mt-0.5 sm:mt-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        ID: {log.entity_id ? log.entity_id.slice(0, 8) : 'N/A'}
                      </span>
                    </div>

                    <div className="text-slate-700 font-medium mt-1">
                      {log.detail?.notes ? (
                        <span>Notes: "{log.detail.notes}"</span>
                      ) : log.detail?.amount ? (
                        <span>
                          Txn ₹{Number(log.detail.amount).toLocaleString()} • VPA: {log.detail.payer_vpa || 'N/A'} • Score: {log.detail.score || 'N/A'}/100
                        </span>
                      ) : (
                        <span>Action performed on {log.entity_type}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end text-[11px] text-slate-400 pl-11 sm:pl-0">
                  <div className="flex items-center gap-1 font-medium text-slate-600">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{log.actor}</span>
                  </div>
                  <div>{formattedTime}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          No audit logs recorded yet.
        </div>
      )}
    </div>
  );
};
