from datetime import datetime, time, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import uuid

class ConfidenceLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CLEARED = "CLEARED"

class RiskFlagStatus(str, Enum):
    OPEN = "open"
    CONFIRMED_RISK = "reviewed_confirmed"
    DISMISSED_FP = "reviewed_dismissed"
    CONTEXT_REQUESTED = "context_requested"

class Merchant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    business_category: str = "Retail / E-Commerce"
    typical_order_min: float = 800.0
    typical_order_max: float = 3500.0
    business_hours_start: str = "09:00"  # HH:MM
    business_hours_end: str = "22:00"    # HH:MM
    vpa: str = "merchant@razorpay"
    settlement_bank_account: Optional[str] = "XXXX-XXXX-4921"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    razorpay_payment_id: str
    merchant_id: str
    payer_vpa: str
    amount: float
    currency: str = "INR"
    order_id: Optional[str] = None
    status: str = "captured"  # captured, refunded, failed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    is_synthetic_mule: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RiskSignalDetail(BaseModel):
    code: str
    title: str
    weight: int
    severity: str  # low, medium, high
    description: str
    observed_value: Any = None
    baseline_value: Any = None
    category_type: str = "base_mule"  # "base_mule" | "fraud_ring"
    disclaimer: Optional[str] = None
    is_simulated_external: bool = False
    is_unverified_heuristic: bool = False

class MitigatingFactorDetail(BaseModel):
    code: str
    title: str
    impact: str  # "Reduces risk score by 15-25%"
    description: str

class AIExplanation(BaseModel):
    summary: str
    explanation: str
    mitigating_note: str
    recommended_action: str
    confidence_level: ConfidenceLevel

class RiskFlag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_id: str
    merchant_id: str
    merchant_name: Optional[str] = None
    payer_vpa: str
    amount: float
    order_id: Optional[str] = None
    payment_created_at: str
    confidence_score: int  # 0 to 100 deterministic anomaly score
    confidence_level: ConfidenceLevel
    signals_triggered: List[RiskSignalDetail] = Field(default_factory=list)
    signals_mitigating: List[MitigatingFactorDetail] = Field(default_factory=list)
    ai_summary: Optional[str] = None
    ai_explanation: Optional[str] = None
    ai_mitigating_note: Optional[str] = None
    ai_recommended_action: Optional[str] = None
    status: RiskFlagStatus = RiskFlagStatus.OPEN
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    is_synthetic_mule: bool = False

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_type: str  # "payment" | "risk_flag" | "merchant" | "simulation"
    entity_id: str
    action: str  # "SCORED", "AI_EXPLAINED", "REVIEW_CONFIRMED", "REVIEW_DISMISSED", "CONTEXT_REQUESTED", "INJECTED_MULE"
    actor: str = "system"  # "system" | "ops_analyst_name"
    detail: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewActionRequest(BaseModel):
    action: str  # "confirm_risk", "dismiss_false_positive", "request_context"
    reviewed_by: str = "Razorpay Ops Analyst"
    notes: Optional[str] = ""

class DashboardSummary(BaseModel):
    total_transactions: int = 0
    total_flagged: int = 0
    under_review: int = 0
    resolved_cleared: int = 0
    confirmed_risks: int = 0
    overall_risk_exposure_pct: float = 0.0
    avg_confidence_score: float = 0.0
    false_positive_rate_pct: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    specificity: float = 0.0
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SyntheticTrafficRequest(BaseModel):
    merchant_id: Optional[str] = None
    normal_count: int = 80
    mule_count: int = 6
    clear_existing: bool = False

class SyntheticMuleInjectRequest(BaseModel):
    merchant_id: Optional[str] = None
    mule_pattern_type: str = "task_app_round_deposit"  # "task_app_round_deposit", "off_hours_burst", "pass_through_cycle"
    custom_amount: Optional[float] = None
    custom_vpa: Optional[str] = None

class CustomSimulationInjectRequest(BaseModel):
    merchant_id: Optional[str] = None
    amount: float = 2500.0
    payer_vpa: str = "user@paytm"
    pattern_type: str = "task_app_round_deposit"

class CopilotChatRequest(BaseModel):
    message: str
    flag_id: Optional[str] = None
    merchant_id: Optional[str] = None
    history: List[Dict[str, str]] = Field(default_factory=list)

class CopilotChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = Field(default_factory=list)
    referenced_signals: List[str] = Field(default_factory=list)
