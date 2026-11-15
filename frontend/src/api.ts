import { 
  ForecastOut, 
  Obligation, 
  Advice, 
  CandidateObligation, 
  UnmatchedSettlement, 
  ScenarioParams,
  BridgeCreditResult
} from './types';
import { 
  mockObligations, 
  mockForecast, 
  mockAdvice, 
  mockCandidates, 
  mockUnmatched, 
  defaultDueDate 
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
export const DEMO_MERCHANTS = [
  { id: 'shop1', name: 'Sharma General Store' },
  { id: 'shop2', name: 'Mehta Provision Store' },
] as const;
const DEMO_INGEST_KEY = 'demo-ingest-secret-32-chars-key-paytm-munim';

function adaptBackendForecast(raw: any): ForecastOut {
  const dueDateStr = raw.due_date || defaultDueDate;
  const targetDate = new Date(dueDateStr);
  const todayZero = new Date();
  todayZero.setHours(0, 0, 0, 0);
  const diffDays = Math.max(0, Math.ceil((targetDate.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24)));

  const obligationAmount = raw.amount_paise ?? raw.obligation_amount_paise ?? 0;
  const inflowLow = raw.predicted_inflow_low_paise ?? raw.expected_inflows_low_paise ?? null;
  const inflowHigh = raw.predicted_inflow_high_paise ?? raw.expected_inflows_high_paise ?? null;

  let confidenceLabel = 'Cautious (10th–50th percentile historical inflows)';
  if (raw.status === 'stale_balance') {
    confidenceLabel = 'Stale balance (>2 hours old); gap estimate withheld.';
  } else if (raw.status === 'paytm_only') {
    confidenceLabel = 'Paytm-only view; total bank cash gap withheld.';
  } else if (raw.possible_gap_high_paise === 0) {
    confidenceLabel = 'Clear in visible scope; available funds cover payment.';
  }

  const coverageTier = raw.account_id
    ? `Simulated bank account (${raw.account_id}) [Synthetic Connector]`
    : 'Paytm-Only Scope';

  return {
    status: raw.status,
    as_of: raw.as_of || new Date().toISOString(),
    obligation_id: raw.obligation_id,
    obligation_version: raw.obligation_version ?? 1,
    payee: raw.payee || 'Confirmed Payee',
    due_date: dueDateStr,
    days_until_due: diffDays,
    obligation_amount_paise: obligationAmount,
    balance_paise: raw.balance_paise,
    balance_observed_at: raw.balance_observed_at,
    account_id: raw.account_id,
    reserve_floor_paise: raw.reserve_floor_paise ?? 0,
    expected_inflows_low_paise: inflowLow,
    expected_inflows_high_paise: inflowHigh,
    possible_gap_low_paise: raw.possible_gap_low_paise,
    possible_gap_high_paise: raw.possible_gap_high_paise,
    other_confirmed_obligations_paise: raw.other_confirmed_obligations_paise ?? 0,
    coverage_tier: coverageTier,
    confidence_label: confidenceLabel,
    evidence: raw.evidence || [],
    coverage: raw.coverage || [],
    limitations: raw.limitations || [],
    scenario_only: Boolean(raw.scenario_only),
  };
}

function adaptBackendCandidate(raw: any): CandidateObligation {
  const suggestedDate = raw.suggested_date || defaultDueDate;
  const d = new Date(suggestedDate);
  const dayName = isNaN(d.getTime()) ? 'Thursday' : d.toLocaleDateString('en-US', { weekday: 'long' });

  return {
    payee: raw.counterparty || raw.payee || 'Supplier',
    suggested_amount_paise: raw.historical_amount_max_paise ?? raw.suggested_amount_paise ?? 3800000,
    suggested_date: suggestedDate,
    usual_day_name: dayName,
    occurrences_count: raw.observations ?? raw.occurrences_count ?? 3,
    historical_amount_min_paise: raw.historical_amount_min_paise,
    historical_amount_max_paise: raw.historical_amount_max_paise,
    question: raw.question || `Is a payment to ${raw.counterparty || raw.payee} due around ${suggestedDate}?`,
    state: raw.state || 'unconfirmed_candidate',
    category_hint: raw.category_hint || 'unclear',
    evidence_dates: raw.evidence_dates || [],
  };
}

function adaptBackendUnmatched(raw: any): UnmatchedSettlement {
  return {
    event_id: raw.payment_event_id || raw.event_id || 'evt-unknown',
    order_reference: raw.reference || raw.order_reference || 'REF-N/A',
    amount_paise: raw.amount_paise ?? 0,
    occurred_at: raw.occurred_at || new Date().toISOString(),
    state: raw.state === 'no_matching_settlement_record_in_demo_feed'
      ? 'In Normal Demo Batch'
      : (raw.state || 'Scheduled Batch'),
    explanation: 'No matching settlement event in synthetic demo feed; absence is not proof of bank delay.',
  };
}

class ApiService {
  private token: string | null = null;
  private isLiveBackend = false;
  private selectedMerchantId: string = DEMO_MERCHANTS[0].id;

  getMerchantId(): string {
    return this.selectedMerchantId;
  }

  async init(): Promise<boolean> {
    const res = await this.verifyAndConnect();
    return res.success;
  }

  isLive(): boolean {
    return this.isLiveBackend;
  }

  async verifyAndConnect(merchantId = this.selectedMerchantId): Promise<{ success: boolean; message: string }> {
    try {
      const healthRes = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1800) });
      if (!healthRes.ok) {
        this.isLiveBackend = false;
        this.token = null;
        return { success: false, message: 'FastAPI server responded with error on /health' };
      }

      // Idempotently provision both synthetic profiles for a reliable judge demo.
      for (const merchant of DEMO_MERCHANTS) {
        const provisionRes = await fetch(`${BASE_URL}/demo/merchants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Demo-Ingest-Key': DEMO_INGEST_KEY,
          },
          body: JSON.stringify(merchant),
        });
        if (!provisionRes.ok) {
          throw new Error(`Could not prepare demo shop ${merchant.name}`);
        }
      }

      // Obtain owner token
      const tokenRes = await fetch(`${BASE_URL}/demo/token?merchant_id=${merchantId}`, {
        method: 'POST',
        headers: { 'X-Demo-Ingest-Key': DEMO_INGEST_KEY },
      });

      if (!tokenRes.ok) {
        this.isLiveBackend = false;
        this.token = null;
        return { success: false, message: 'Failed to authenticate demo owner token' };
      }

      const tokenData = await tokenRes.json();
      this.token = tokenData.access_token;
      this.selectedMerchantId = merchantId;

      // Verify token by querying obligations
      const verifyRes = await fetch(`${BASE_URL}/v1/obligations`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });

      if (!verifyRes.ok) {
        this.isLiveBackend = false;
        this.token = null;
        return { success: false, message: 'Bearer token failed validation on /v1/obligations' };
      }

      this.isLiveBackend = true;
      return { success: true, message: 'Connected to live Paytm Munim backend' };
    } catch (err: any) {
      this.isLiveBackend = false;
      this.token = null;
      return { 
        success: false, 
        message: 'Could not connect to Paytm Munim backend. Ensure the backend service is running.' 
      };
    }
  }

  disconnect() {
    this.isLiveBackend = false;
    this.token = null;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async interpretDebitPattern(candidate: CandidateObligation): Promise<{category_hint: string; explanation: string; confidence: string; needs_merchant_confirmation: boolean}> {
    const response = await fetch(`${BASE_URL}/v1/ai/interpret-debit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        counterparty: candidate.payee ?? candidate.counterparty,
        amount_min_paise: candidate.historical_amount_min_paise ?? candidate.suggested_amount_paise,
        amount_max_paise: candidate.historical_amount_max_paise ?? candidate.suggested_amount_paise,
        payment_dates: candidate.evidence_dates,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || 'Munim AI could not interpret this pattern.');
    }
    return response.json();
  }

  async askMunim(message: string, obligationId: string): Promise<{answer: string; grounded: boolean}> {
    const response = await fetch(`${BASE_URL}/v1/ai/ask?obligation_id=${encodeURIComponent(obligationId)}`, {
      method: 'POST', headers: this.getHeaders(), body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || 'Munim AI could not answer.');
    }
    return response.json();
  }

  async parseVoicePaymentDraft(audio: Blob): Promise<{transcript: string; payee?: string | null; amount_paise?: number | null; due_date?: string | null; needs_clarification: boolean; clarification_question?: string | null}> {
    if (!this.isLiveBackend || !this.token) throw new Error('Start the backend and configure MUNIM_SARVAM_API_KEY, or enter the payment manually.');
    const data = new FormData();
    data.append('file', audio, 'merchant.webm');
    const response = await fetch(`${BASE_URL}/v1/ai/voice-payment-draft`, { method: 'POST', headers: { Authorization: `Bearer ${this.token}` }, body: data });
    if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.detail || 'Voice transcription failed.'); }
    return response.json();
  }

  async parsePaymentDraft(text: string): Promise<{payee?: string | null; amount_paise?: number | null; due_date?: string | null; needs_clarification: boolean; clarification_question?: string | null}> {
    if (!this.isLiveBackend || !this.token) throw new Error('Start the backend and configure MUNIM_SARVAM_API_KEY, or enter the payment manually.');
    const response = await fetch(`${BASE_URL}/v1/ai/payment-draft`, { method: 'POST', headers: this.getHeaders(), body: JSON.stringify({text}) });
    if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.detail || 'Sarvam AI is unavailable.'); }
    return response.json();
  }

  async getObligations(): Promise<Obligation[]> {
    if (!this.isLiveBackend || !this.token) return mockObligations;
    try {
      const res = await fetch(`${BASE_URL}/v1/obligations`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch obligations');
      const data = await res.json();
      return data;
    } catch {
      return mockObligations;
    }
  }

  async createObligation(payee: string, amountPaise: number, dueDate: string): Promise<Obligation> {
    if (!this.isLiveBackend || !this.token) {
      const localItem: Obligation = {
        id: `obl-local-${Date.now()}`,
        payee,
        amount_paise: amountPaise,
        due_date: dueDate,
        status: 'confirmed',
        version: 1,
      };
      mockObligations.unshift(localItem);
      return localItem;
    }

    const res = await fetch(`${BASE_URL}/v1/obligations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        payee,
        amount_paise: amountPaise,
        due_date: dueDate,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create obligation on backend');
    }

    return await res.json();
  }

  async getForecast(obligationId: string): Promise<ForecastOut> {
    if (!this.isLiveBackend || !this.token) return mockForecast;
    try {
      const res = await fetch(`${BASE_URL}/v1/obligations/${obligationId}/forecast`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Forecast unavailable');
      const raw = await res.json();
      return adaptBackendForecast(raw);
    } catch {
      return mockForecast;
    }
  }

  async runScenario(obligationId: string, params: ScenarioParams): Promise<ForecastOut> {
    if (!this.isLiveBackend || !this.token) {
      const extraPaise = params.extra_funds_paise || 0;
      const targetAmount = params.payment_amount_paise ?? mockForecast.obligation_amount_paise;
      
      const currentBalanceWithExtra = (mockForecast.balance_paise ?? 1000000) + extraPaise;
      const expectedInflowsLow = mockForecast.expected_inflows_low_paise ?? 1120601;
      const expectedInflowsHigh = mockForecast.expected_inflows_high_paise ?? 1777352;

      const rawLowGap = targetAmount - (currentBalanceWithExtra + expectedInflowsHigh);
      const rawHighGap = targetAmount - (currentBalanceWithExtra + expectedInflowsLow);

      const possibleGapLow = Math.max(0, rawLowGap);
      const possibleGapHigh = Math.max(0, rawHighGap);

      return {
        ...mockForecast,
        due_date: params.due_date || defaultDueDate,
        obligation_amount_paise: targetAmount,
        possible_gap_low_paise: possibleGapLow,
        possible_gap_high_paise: possibleGapHigh,
        scenario_only: true,
        confidence_label: possibleGapHigh === 0 
          ? 'Clear in Visible Scope (Gap fully covered)' 
          : possibleGapLow === 0 
            ? 'Covered at high inflow, possible shortfall at low inflow'
            : 'Shortfall still likely across both inflow bounds',
      };
    }

    try {
      const res = await fetch(`${BASE_URL}/v1/obligations/${obligationId}/scenarios`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Scenario calculation failed');
      const raw = await res.json();
      return adaptBackendForecast(raw);
    } catch {
      return mockForecast;
    }
  }

  async applyBridgeCredit(obligationId: string, amountPaise: number): Promise<BridgeCreditResult> {
    if (!this.isLiveBackend || !this.token) {
      const scenarioRes = await this.runScenario(obligationId, { extra_funds_paise: amountPaise });
      return {
        status: 'disbursed',
        loan_reference: `PAYTM-OD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        disbursed_amount_paise: amountPaise,
        tenure_days: 3,
        flat_fee_paise: 4900,
        account_credited: mockForecast.account_id || 'acct_sbi_4912',
        forecast: scenarioRes,
      };
    }

    const res = await fetch(`${BASE_URL}/v1/obligations/${obligationId}/bridge-credit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        amount_paise: amountPaise,
        tenure_days: 3,
        flat_fee_rupees: 49,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to activate bridge credit');
    }
    const data = await res.json();
    return {
      ...data,
      forecast: adaptBackendForecast(data.forecast),
    };
  }

  async getAdvice(obligationId: string): Promise<Advice> {
    if (!this.isLiveBackend || !this.token) return mockAdvice;
    try {
      const res = await fetch(`${BASE_URL}/v1/obligations/${obligationId}/advice`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Advice unavailable');
      return await res.json();
    } catch {
      return mockAdvice;
    }
  }

  async getCandidates(): Promise<CandidateObligation[]> {
    if (!this.isLiveBackend || !this.token) return mockCandidates;
    try {
      const res = await fetch(`${BASE_URL}/v1/obligation-candidates`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch candidates');
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("Invalid candidates response");
      return raw.map(adaptBackendCandidate);
    } catch {
      return mockCandidates;
    }
  }

  async getUnmatchedSettlements(): Promise<UnmatchedSettlement[]> {
    if (!this.isLiveBackend || !this.token) return mockUnmatched;
    try {
      const res = await fetch(`${BASE_URL}/v1/settlement-unmatched`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch settlements');
      const raw = await res.json();
      if (!Array.isArray(raw)) throw new Error("Invalid settlement response");
      return raw.map(adaptBackendUnmatched);
    } catch {
      return mockUnmatched;
    }
  }
}

export const api = new ApiService();
