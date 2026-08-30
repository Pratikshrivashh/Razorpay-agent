import { Merchant, RiskFlag, DashboardSummary, AuditLog, CopilotMessage } from '../types';

const API_BASE = '/api';

export async function fetchMerchants(): Promise<Merchant[]> {
  const res = await fetch(`${API_BASE}/merchants`);
  if (!res.ok) throw new Error('Failed to fetch merchants');
  return res.json();
}

export async function fetchDashboardSummary(merchantId?: string): Promise<DashboardSummary> {
  const url = merchantId ? `${API_BASE}/dashboard/summary?merchant_id=${merchantId}` : `${API_BASE}/dashboard/summary`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchRiskFlags(merchantId?: string, status?: string): Promise<RiskFlag[]> {
  let url = `${API_BASE}/flags?`;
  if (merchantId) url += `merchant_id=${merchantId}&`;
  if (status && status !== 'all') url += `status=${status}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch risk flags');
  return res.json();
}

export async function fetchFlagDetails(flagId: string): Promise<RiskFlag> {
  const res = await fetch(`${API_BASE}/flags/${flagId}`);
  if (!res.ok) throw new Error('Failed to fetch flag details');
  return res.json();
}

export async function reviewRiskFlag(
  flagId: string,
  action: 'confirm_risk' | 'dismiss_false_positive' | 'request_context',
  reviewerName: string,
  notes?: string
): Promise<RiskFlag> {
  const res = await fetch(`${API_BASE}/flags/${flagId}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      reviewed_by: reviewerName,
      notes: notes || ''
    })
  });
  if (!res.ok) throw new Error('Failed to submit review');
  return res.json();
}

export async function generateDemoTraffic(
  merchantId?: string,
  normalCount = 45,
  muleCount = 4,
  clearExisting = false
): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: merchantId,
      normal_count: normalCount,
      mule_count: muleCount,
      clear_existing: clearExisting
    })
  });
  if (!res.ok) throw new Error('Failed to generate demo traffic');
  return res.json();
}

export async function injectMulePattern(
  merchantId?: string,
  patternType = 'task_app_round_deposit',
  customAmount?: number,
  customVpa?: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/inject-mule-pattern`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: merchantId,
      mule_pattern_type: patternType,
      custom_amount: customAmount,
      custom_vpa: customVpa
    })
  });
  if (!res.ok) throw new Error('Failed to inject mule pattern');
  return res.json();
}

export async function injectCustomMulePattern(
  merchantId?: string,
  amount = 2500,
  payerVpa = 'user@paytm',
  patternType = 'task_app_round_deposit'
): Promise<any> {
  const res = await fetch(`${API_BASE}/simulation/inject-custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: Number(amount),
      payer_vpa: payerVpa,
      pattern_type: patternType
    })
  });
  if (!res.ok) throw new Error('Failed to inject custom mule pattern');
  return res.json();
}

export async function resetDemoDataset(): Promise<any> {
  const res = await fetch(`${API_BASE}/demo/reset`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset dataset');
  return res.json();
}

export async function fetchTimeline(): Promise<{ audit_logs: AuditLog[]; recent_flags: RiskFlag[] }> {
  const res = await fetch(`${API_BASE}/dashboard/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function sendCopilotChat(
  message: string,
  flagId?: string,
  merchantId?: string
): Promise<{ reply: string; suggested_actions: string[]; referenced_signals: string[] }> {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      flag_id: flagId,
      merchant_id: merchantId
    })
  });
  if (!res.ok) throw new Error('Failed to get copilot reply');
  return res.json();
}
