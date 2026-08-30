import React, { useState } from 'react';
import { RiskFlag, RiskFlagStatus } from '../types';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Bot,
  User,
  Clock,
  FileText,
  CheckCircle2,
  HelpCircle,
  Hash,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { reviewRiskFlag } from '../services/api';

interface EvidenceModalProps {
  flag: RiskFlag | null;
  onClose: () => void;
  onReviewed: (updatedFlag: RiskFlag) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  flag,
  onClose,
  onReviewed
}) => {
  if (!flag) return null;

  const [reviewerName, setReviewerName] = useState('Razorpay Ops Analyst');
  const [reviewNotes, setReviewNotes] = useState(flag.review_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleReviewAction = async (action: 'confirm_risk' | 'dismiss_false_positive' | 'request_context') => {
    try {
      setIsSubmitting(true);
      const updated = await reviewRiskFlag(flag.id, action, reviewerName, reviewNotes);
      setActionSuccess(
        action === 'confirm_risk'
          ? 'Risk Confirmed: Transaction logged for merchant alert.'
          : action === 'dismiss_false_positive'
          ? 'False Positive Dismissed: Alert cleared.'
          : 'Context Requested from Merchant.'
      );
      setTimeout(() => {
        onReviewed(updated);
      }, 800);
    } catch (e: any) {
      alert(`Review action failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scoreColor =
    flag.confidence_score >= 80
      ? 'text-red-600 bg-red-50 border-red-200'
      : flag.confidence_score >= 60
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-blue-600 bg-blue-50 border-blue-200';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="bg-surface w-full max-w-4xl rounded-2xl shadow-xl card-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Payment Evidence Breakdown
                </h3>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                  {flag.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Multi-signal correlation & contextual false-positive verification.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {/* Key Transaction Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-subtle rounded-xl card-border">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Amount</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                ₹{flag.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Payer VPA</div>
              <div className="text-xs font-mono font-bold text-slate-800 mt-1 truncate" title={flag.payer_vpa}>
                {flag.payer_vpa}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Order Linkage</div>
              <div className="text-xs font-semibold mt-1">
                {flag.order_id ? (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                    {flag.order_id}
                  </span>
                ) : (
                  <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    No Order Ref
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Created At</div>
              <div className="text-xs text-slate-700 font-medium mt-1">
                {new Date(flag.payment_created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 12-Signal Triggered Badge Tags Strip */}
          {flag.signals_triggered.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-3 bg-red-50/50 rounded-xl border border-red-200">
              <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider mr-1">
                Triggered Mule Signals:
              </span>
              {flag.signals_triggered.map((sig) => (
                <span
                  key={sig.code}
                  className="px-2.5 py-1 rounded-full bg-white text-red-800 border border-red-200 text-xs font-bold shadow-2xs flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                  <span>{sig.title}</span>
                  <span className="text-[10px] bg-red-100 text-red-900 px-1.5 py-0.2 rounded font-mono">
                    +{sig.weight}
                  </span>
                </span>
              ))}
            </div>
          )}

          {/* Anomaly Score Meter */}
          <div className="p-4 bg-surface rounded-xl card-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-extrabold shadow-2xs ${scoreColor}`}>
                <span className="text-2xl leading-none">{flag.confidence_score}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">/ 100</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Deterministic Anomaly Score</span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                    {flag.confidence_level} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  Calculated purely via deterministic rules across merchant order baselines and historical payer linkages.
                </p>
              </div>
            </div>

            <div className="w-full md:w-48 flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Threshold Status</span>
                <span>{flag.confidence_score}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    flag.confidence_score >= 80
                      ? 'bg-red-500'
                      : flag.confidence_score >= 60
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${flag.confidence_score}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Signals Triggered vs False-Positive Guard (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Risk Signals Categorized */}
            <div className="flex flex-col gap-4">
              {/* Base Mule Risk Signals */}
              <div className="bg-red-50/40 rounded-xl p-4 border border-red-200 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-red-200 pb-2">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Base Mule Risk Signals ({flag.signals_triggered.filter(s => s.category_type !== 'fraud_ring').length})</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                    Action: Soft Warning to Merchant
                  </span>
                </div>

                <div className="space-y-2.5">
                  {flag.signals_triggered.filter(s => s.category_type !== 'fraud_ring').map((sig) => (
                    <div key={sig.code} className="bg-white p-3 rounded-lg card-border shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{sig.title}</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          +{sig.weight} pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{sig.description}</p>
                      {sig.baseline_value && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span>Observed: <strong className="text-slate-800">{String(sig.observed_value)}</strong></span>
                          <span>Baseline: <strong className="text-slate-800">{String(sig.baseline_value)}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                  {flag.signals_triggered.filter(s => s.category_type !== 'fraud_ring').length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                      No base mule signals triggered.
                    </div>
                  )}
                </div>
              </div>

              {/* Fraud Ring Pattern Match Sub-section */}
              <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-200 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-purple-700" />
                    <span>Fraud Ring Pattern Match ({flag.signals_triggered.filter(s => s.category_type === 'fraud_ring').length})</span>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded border border-purple-300">
                    Action: Escalate to Compliance / ED Liaison
                  </span>
                </div>

                <div className="space-y-2.5">
                  {flag.signals_triggered.filter(s => s.category_type === 'fraud_ring').map((sig) => (
                    <div key={sig.code} className="bg-white p-3 rounded-lg border border-purple-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <span>{sig.title}</span>
                          {sig.is_simulated_external && (
                            <span className="text-[9px] font-semibold bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200">
                              Simulated External
                            </span>
                          )}
                          {sig.is_unverified_heuristic && (
                            <span className="text-[9px] font-semibold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                              Unverified Heuristic
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                          +{sig.weight} pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{sig.description}</p>
                      
                      {/* Mandatory Disclaimer Display */}
                      {sig.disclaimer && (
                        <div className="mt-2 p-2 rounded bg-amber-50/80 border border-amber-200 text-[10px] font-medium text-amber-900 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Disclaimer:</strong> {sig.disclaimer}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {flag.signals_triggered.filter(s => s.category_type === 'fraud_ring').length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                      No organized fraud ring pattern signatures matched for this payment.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: False-Positive Guard */}
            <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>False-Positive Guard ({flag.signals_mitigating.length})</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {flag.signals_mitigating.length > 0 ? (
                  flag.signals_mitigating.map((mit) => (
                    <div key={mit.code} className="bg-surface p-3 rounded-lg card-border shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-emerald-900">{mit.title}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Lowers Risk
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{mit.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500 bg-surface rounded-lg card-border">
                    No mitigating factors identified in historical merchant ledger.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gemini AI Explanation Layer */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/60 via-surface to-purple-50/30 rounded-xl border border-primary/20 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Sentinel AI Explanation Layer (Gemini)</span>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900 bg-white/80 p-2.5 rounded-lg border border-primary/10">
                Summary: {flag.ai_summary || flag.ai_explanation}
              </div>

              {flag.ai_explanation && (
                <div className="text-xs text-slate-700 leading-relaxed bg-white/60 p-3 rounded-lg border border-primary/10">
                  <div className="font-semibold text-slate-900 mb-1">Pattern Analysis:</div>
                  {flag.ai_explanation}
                </div>
              )}

              {flag.ai_mitigating_note && (
                <div className="text-xs text-emerald-800 bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200">
                  <strong>Mitigating Context:</strong> {flag.ai_mitigating_note}
                </div>
              )}

              {flag.ai_recommended_action && (
                <div className="text-xs text-indigo-900 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-200 flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Proactive Ops Recommendation:</strong> {flag.ai_recommended_action}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Human-in-the-Loop Review Box */}
          <div className="p-4 bg-surface rounded-xl card-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span>Human-In-The-Loop Ops Decision</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Agent never auto-freezes. Final action requires ops sign-off.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Reviewer Name / ID
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Review Notes / Justification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified task-app scam QR, or validated customer invoice..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-subtle border border-border rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              {/* Action 1: Confirm Risk */}
              <button
                onClick={() => handleReviewAction('confirm_risk')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Confirm Risk (Alert Merchant)</span>
              </button>

              {/* Action 2: Request Context */}
              <button
                onClick={() => handleReviewAction('request_context')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Request Context from Merchant</span>
              </button>

              {/* Action 3: Dismiss False Positive */}
              <button
                onClick={() => handleReviewAction('dismiss_false_positive')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Dismiss as False Positive</span>
              </button>
            </div>

            {actionSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold text-center">
                {actionSuccess}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 bg-surface-subtle border-t border-border flex items-center justify-between text-xs text-slate-500">
          <div>
            Payment ID: <span className="font-mono text-slate-700">{flag.payment_id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
