import { ForecastOut, Obligation, CandidateObligation, UnmatchedSettlement, Advice } from './types';

const today = new Date();
const targetDate = new Date(today);
targetDate.setDate(today.getDate() + 4);
export const defaultDueDate = targetDate.toISOString().split('T')[0];

export const mockObligations: Obligation[] = [
  {
    id: 'obl-gupta-101',
    payee: 'Gupta Traders (FMCG Wholesale)',
    amount_paise: 3800000, // ₹38,000
    due_date: defaultDueDate,
    status: 'confirmed',
    version: 1,
  },
  {
    id: 'obl-amul-102',
    payee: 'Amul Milk & Dairy Depot',
    amount_paise: 450000, // ₹4,500
    due_date: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
    status: 'confirmed',
    version: 1,
  }
];

export const mockForecast: ForecastOut = {
  status: 'ready',
  as_of: new Date().toISOString(),
  obligation_id: 'obl-gupta-101',
  obligation_version: 1,
  payee: 'Gupta Traders (FMCG Wholesale)',
  due_date: defaultDueDate,
  days_until_due: 4,
  obligation_amount_paise: 3800000,
  balance_paise: 1000000, // ₹10,000
  balance_observed_at: new Date(Date.now() - 900000).toISOString(), // 15m ago
  account_id: 'acct_sbi_4912',
  other_confirmed_obligations_paise: 0,
  reserve_floor_paise: 0,
  expected_inflows_low_paise: 1120601, // ₹11,206
  expected_inflows_high_paise: 1777352, // ₹17,773
  possible_gap_low_paise: 1022648, // ₹10,226
  possible_gap_high_paise: 1679399, // ₹16,793
  coverage_tier: 'Simulated SBI A/C (Synthetic Connector)',
  confidence_label: 'Cautious (10th–50th percentile historical inflows)',
  evidence: [
    'Synthetic bank balance ₹10,000 observed 15m ago',
    '8 weeks of weekday credit history across 48 simulated bank deposits',
    'Heuristic weekday distribution: ₹2,500 – ₹4,800 per day'
  ],
  coverage: [
    'Connected account: SBI Current A/C (****4912) [Synthetic Feed]',
    'Paytm Soundbox QR Collections actively settling to this account'
  ],
  limitations: [
    'Cash in store drawer is excluded unless manually declared',
    'Unconnected secondary bank accounts or loans outside view'
  ],
  scenario_only: false,
};

export const mockAdvice: Advice = {
  obligation_id: 'obl-gupta-101',
  as_of: new Date().toISOString(),
  level: 'attention',
  message: 'A shortfall is likely before this confirmed obligation is due. Review missing cash flows and terms before acting.',
  options: [
    {
      code: 'DECLARE_CASH',
      title: 'Declare In-Hand Cash',
      prerequisite: 'Merchant verifies unbanked cash available in shop drawer.',
      requires_owner_approval: true,
    },
    {
      code: 'SPLIT_PAYMENT',
      title: 'Request 50% Supplier Split',
      prerequisite: 'Pay ₹19,000 on Thursday, balance ₹19,000 following Monday.',
      requires_owner_approval: true,
    },
    {
      code: 'SHIFT_DATE',
      title: 'Negotiate Friday/Saturday Delivery',
      prerequisite: 'Gain 1–2 additional days of customer collections (adds ~₹5,000–₹9,000).',
      requires_owner_approval: true,
    },
    {
      code: 'PAYTM_EARLY_SETTLEMENT',
      title: 'Trigger Instant Paytm Settlement',
      prerequisite: 'Clears today’s pending ₹4,200 UPI collections immediately.',
      requires_owner_approval: true,
    }
  ],
  evidence: [
    'Confirmed obligation of ₹38,000 due in 4 days',
    'Current balance ₹10,000 + cautious inflows ₹11,206 = ₹21,206 available',
    'Shortfall ₹38,000 - ₹21,206 = ~₹16,794 gap at low inflow rate'
  ]
};

export const mockCandidates: CandidateObligation[] = [
  {
    payee: 'Amul Milk Depot',
    suggested_amount_paise: 450000,
    suggested_date: new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0],
    usual_day_name: 'Friday',
    occurrences_count: 4,
    historical_amount_min_paise: 450000,
    historical_amount_max_paise: 450000,
    question: 'Is a payment to Amul Milk Depot due around 5 days from now?',
    state: 'unconfirmed_candidate'
  }
];

export const mockUnmatched: UnmatchedSettlement[] = [
  {
    event_id: 'unsettled-pay-1',
    order_reference: 'PTM-ORD-88102',
    amount_paise: 185000, // ₹1,850
    occurred_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    state: 'No Matching Settlement Record in Demo Feed',
    explanation: 'UPI payment received last evening in demo feed. Scheduled for automated 7:00 AM simulated bank batch.'
  }
];
