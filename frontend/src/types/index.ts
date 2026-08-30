export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CLEARED';

export type RiskFlagStatus = 'open' | 'reviewed_confirmed' | 'reviewed_dismissed' | 'context_requested' | 'confirmed_risk' | 'dismissed';

export interface Merchant {
  id: string;
  name: string;
  business_category: string;
  typical_order_min: number;
  typical_order_max: number;
  business_hours_start: string;
  business_hours_end: string;
  vpa: string;
  settlement_bank_account?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  razorpay_payment_id: string;
  merchant_id: string;
  payer_vpa: string;
  amount: number;
  currency: string;
  order_id?: string | null;
  status: string;
  created_at: string;
  is_synthetic_mule: boolean;
  metadata?: Record<string, any>;
}

export interface RiskSignalDetail {
  code: string;
  title: string;
  weight: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  observed_value?: any;
  baseline_value?: any;
  category_type?: 'base_mule' | 'fraud_ring';
  disclaimer?: string;
  is_simulated_external?: boolean;
  is_unverified_heuristic?: boolean;
}

export interface MitigatingFactorDetail {
  code: string;
  title: string;
  impact: string;
  description: string;
}

export interface RiskFlag {
  id: string;
  payment_id: string;
  merchant_id: string;
  merchant_name?: string;
  payer_vpa: string;
  amount: number;
  order_id?: string | null;
  payment_created_at: string;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  signals_triggered: RiskSignalDetail[];
  signals_mitigating: MitigatingFactorDetail[];
  ai_summary?: string;
  ai_explanation?: string;
  ai_mitigating_note?: string;
  ai_recommended_action?: string;
  status: RiskFlagStatus;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  review_notes?: string | null;
  is_synthetic_mule: boolean;
}

export interface DashboardSummary {
  total_transactions: number;
  total_flagged: number;
  under_review: number;
  resolved_cleared: number;
  confirmed_risks: number;
  overall_risk_exposure_pct: number;
  avg_confidence_score: number;
  false_positive_rate_pct: number;
  precision: number;
  recall: number;
  specificity: number;
  last_updated: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  detail: Record<string, any>;
  timestamp: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}
