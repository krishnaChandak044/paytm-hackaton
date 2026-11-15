export interface ActionOption {
  code: string;
  title: string;
  prerequisite: string;
  requires_owner_approval: boolean;
}

export interface Advice {
  obligation_id: string;
  as_of: string;
  level: 'attention' | 'insufficient_evidence' | 'clear_in_visible_scope';
  message: string;
  options: ActionOption[];
  evidence: string[];
}

/** Canonical UI shape; api.ts maps backend field names and derives display-only fields. */
export interface ForecastOut {
  status: 'ready' | 'stale_balance' | 'insufficient_history' | 'paytm_only';
  as_of: string;
  obligation_id: string;
  obligation_version: number;
  payee: string;
  due_date: string;
  days_until_due: number;
  obligation_amount_paise: number;
  balance_paise: number | null;
  balance_observed_at: string | null;
  account_id: string | null;
  coverage_tier?: string;
  reserve_floor_paise: number;
  expected_inflows_low_paise: number | null;
  expected_inflows_high_paise: number | null;
  possible_gap_low_paise: number | null;
  possible_gap_high_paise: number | null;
  other_confirmed_obligations_paise: number;
  confidence_label: string;
  evidence: string[];
  coverage: string[];
  limitations: string[];
  scenario_only: boolean;
}

export interface Obligation {
  id: string;
  payee: string;
  amount_paise: number;
  due_date: string;
  status: 'confirmed' | 'cancelled' | 'paid';
  version: number;
}

export interface CandidateObligation {
  counterparty?: string;
  payee?: string;
  suggested_amount_paise?: number;
  historical_amount_min_paise?: number;
  historical_amount_max_paise?: number;
  suggested_date?: string;
  usual_day_of_week?: number;
  usual_day_name?: string;
  occurrences_count?: number;
  observations?: number;
  last_occurred_at?: string;
  question: string;
  state?: string;
  category_hint?: string;
  evidence_dates?: string[];
}

export interface UnmatchedSettlement {
  payment_event_id?: string;
  event_id?: string;
  reference?: string;
  order_reference?: string;
  amount_paise: number;
  occurred_at: string;
  state: string;
  explanation?: string;
}

export interface ScenarioParams {
  payment_amount_paise?: number;
  extra_funds_paise: number;
  due_date?: string;
}

export interface BridgeCreditResult {
  status: 'disbursed';
  loan_reference: string;
  disbursed_amount_paise: number;
  tenure_days: number;
  flat_fee_paise: number;
  account_credited: string;
  forecast: ForecastOut;
}
