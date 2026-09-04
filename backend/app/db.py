import json
import os
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from .config import settings
from .models import Merchant, Payment, RiskFlag, AuditLog, RiskFlagStatus, AutoFreezePolicy

class Database:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or settings.DB_PATH
        self.lock = threading.RLock()
        self._ensure_db_exists()

    def _ensure_db_exists(self):
        with self.lock:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            if not self.db_path.exists():
                initial_data = {
                    "merchants": {},
                    "payments": {},
                    "risk_flags": {},
                    "audit_log": [],
                    "system_stats": {
                        "total_inspected": 0,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                }
                with open(self.db_path, "w", encoding="utf-8") as f:
                    json.dump(initial_data, f, indent=2)
                self._seed_default_merchants()

    def _read_data(self) -> Dict[str, Any]:
        with self.lock:
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                self._ensure_db_exists()
                with open(self.db_path, "r", encoding="utf-8") as f:
                    return json.load(f)

    def _write_data(self, data: Dict[str, Any]):
        with self.lock:
            temp_path = self.db_path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
            os.replace(temp_path, self.db_path)

    def _seed_default_merchants(self):
        default_merchants = [
            Merchant(
                id="mer_aura_jewels_001",
                name="Aura Handcrafted Jewels",
                business_category="Fashion & Luxury",
                typical_order_min=1200.0,
                typical_order_max=6500.0,
                business_hours_start="09:30",
                business_hours_end="21:30",
                vpa="aurajewels@razorpay",
                settlement_bank_account="HDFC-XXXX-8912"
            ),
            Merchant(
                id="mer_nexus_saas_002",
                name="Nexus Cloud & SaaS",
                business_category="Software & Services",
                typical_order_min=2500.0,
                typical_order_max=15000.0,
                business_hours_start="08:00",
                business_hours_end="20:00",
                vpa="nexustech@razorpay",
                settlement_bank_account="ICICI-XXXX-3341"
            ),
            Merchant(
                id="mer_greenroot_003",
                name="GreenRoot Organic Grocers",
                business_category="Grocery & Daily Needs",
                typical_order_min=450.0,
                typical_order_max=2200.0,
                business_hours_start="07:00",
                business_hours_end="23:00",
                vpa="greenroot@razorpay",
                settlement_bank_account="AXIS-XXXX-5520"
            )
        ]
        data = self._read_data()
        for m in default_merchants:
            data["merchants"][m.id] = m.model_dump()
        self._write_data(data)

    # ---------------- Merchant Methods ----------------
    def list_merchants(self) -> List[Merchant]:
        data = self._read_data()
        return [Merchant(**m) for m in data.get("merchants", {}).values()]

    def get_merchant(self, merchant_id: str) -> Optional[Merchant]:
        data = self._read_data()
        m_dict = data.get("merchants", {}).get(merchant_id)
        return Merchant(**m_dict) if m_dict else None

    def add_merchant(self, merchant: Merchant) -> Merchant:
        data = self._read_data()
        data.setdefault("merchants", {})[merchant.id] = merchant.model_dump()
        self._write_data(data)
        return merchant

    # ---------------- Payment Methods ----------------
    def add_payment(self, payment: Payment) -> Payment:
        data = self._read_data()
        data.setdefault("payments", {})[payment.id] = payment.model_dump()
        data["system_stats"]["total_inspected"] = data["system_stats"].get("total_inspected", 0) + 1
        self._write_data(data)
        return payment

    def get_payment(self, payment_id: str) -> Optional[Payment]:
        data = self._read_data()
        p_dict = data.get("payments", {}).get(payment_id)
        return Payment(**p_dict) if p_dict else None

    def get_payment_by_rzp_id(self, rzp_id: str) -> Optional[Payment]:
        data = self._read_data()
        for p in data.get("payments", {}).values():
            if p.get("razorpay_payment_id") == rzp_id:
                return Payment(**p)
        return None

    def list_payments(self, merchant_id: Optional[str] = None, limit: int = 200) -> List[Payment]:
        data = self._read_data()
        payments = list(data.get("payments", {}).values())
        if merchant_id:
            payments = [p for p in payments if p.get("merchant_id") == merchant_id]
        # sort by created_at descending
        payments.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return [Payment(**p) for p in payments[:limit]]

    def get_payer_history_count(self, merchant_id: str, payer_vpa: str, exclude_payment_id: Optional[str] = None) -> int:
        data = self._read_data()
        count = 0
        for p in data.get("payments", {}).values():
            if p.get("merchant_id") == merchant_id and p.get("payer_vpa", "").lower() == payer_vpa.lower():
                if exclude_payment_id and p.get("id") == exclude_payment_id:
                    continue
                count += 1
        return count

    # ---------------- Risk Flag Methods ----------------
    def add_risk_flag(self, flag: RiskFlag) -> RiskFlag:
        data = self._read_data()
        data.setdefault("risk_flags", {})[flag.id] = flag.model_dump()
        self._write_data(data)
        return flag

    def get_risk_flag(self, flag_id: str) -> Optional[RiskFlag]:
        data = self._read_data()
        flags = data.get("risk_flags", {})
        if flag_id in flags:
            return RiskFlag(**flags[flag_id])
        # Fallback search by payment_id or razorpay_payment_id
        for f in flags.values():
            if f.get("payment_id") == flag_id or f.get("id") == flag_id or f.get("razorpay_payment_id") == flag_id:
                return RiskFlag(**f)
        return None

    def get_risk_flag_by_payment_id(self, payment_id: str) -> Optional[RiskFlag]:
        data = self._read_data()
        for f in data.get("risk_flags", {}).values():
            if f.get("payment_id") == payment_id or f.get("id") == payment_id:
                return RiskFlag(**f)
        return None

    def _normalize_flag(self, f_dict: Dict[str, Any]) -> RiskFlag:
        score = f_dict.get("confidence_score", 0)
        if score >= 80 or f_dict.get("auto_frozen"):
            f_dict["auto_frozen"] = True
            if not f_dict.get("settlement_hold_until"):
                f_dict["settlement_hold_until"] = "24 Hours (Active Lock)"
        return RiskFlag(**f_dict)

    def list_risk_flags(self, merchant_id: Optional[str] = None, status: Optional[str] = None) -> List[RiskFlag]:
        data = self._read_data()
        flags = list(data.get("risk_flags", {}).values())
        if merchant_id:
            flags = [f for f in flags if f.get("merchant_id") == merchant_id]
        if status and status != "all":
            flags = [f for f in flags if f.get("status") == status]
        # sort by created_at descending
        flags.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return [self._normalize_flag(f) for f in flags]

    def update_risk_flag(self, flag_id: str, updates: Dict[str, Any]) -> Optional[RiskFlag]:
        data = self._read_data()
        flags = data.get("risk_flags", {})
        target_id = flag_id
        if target_id not in flags:
            for fid, f in flags.items():
                if f.get("payment_id") == flag_id or f.get("id") == flag_id:
                    target_id = fid
                    break
        if target_id not in flags:
            return None
        flags[target_id].update(updates)
        self._write_data(data)
        return RiskFlag(**flags[target_id])

    # ---------------- Audit Log Methods ----------------
    def add_audit_log(self, log_entry: AuditLog) -> AuditLog:
        data = self._read_data()
        data.setdefault("audit_log", []).append(log_entry.model_dump())
        self._write_data(data)
        return log_entry

    def list_audit_logs(self, limit: int = 50) -> List[AuditLog]:
        data = self._read_data()
        logs = list(data.get("audit_log", []))
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return [AuditLog(**entry) for entry in logs[:limit]]

    # ---------------- Auto-Freeze Policy Methods ----------------
    def get_auto_freeze_policy(self) -> AutoFreezePolicy:
        data = self._read_data()
        policy_dict = data.get("auto_freeze_policy")
        if not policy_dict:
            policy = AutoFreezePolicy()
            data["auto_freeze_policy"] = policy.model_dump()
            self._write_data(data)
            return policy
        return AutoFreezePolicy(**policy_dict)

    def update_auto_freeze_policy(self, policy: AutoFreezePolicy) -> AutoFreezePolicy:
        data = self._read_data()
        data["auto_freeze_policy"] = policy.model_dump()
        self._write_data(data)
        return policy

    # ---------------- Reset & Stats ----------------
    def reset_dataset(self):
        with self.lock:
            if self.db_path.exists():
                self.db_path.unlink()
            self._ensure_db_exists()

db = Database()
