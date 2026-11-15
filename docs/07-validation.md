# 07 — Discovery, evaluation, and launch gates

## Evidence still missing

No merchant interviews, pilot outcomes, Paytm internal access, forecast calibration scores, or avoided-loss figures have been supplied for this proposal. The product remains a hypothesis until the following tests. A technically accurate forecast can still fail if merchants cannot act or if alerts arrive too often.

## Merchant discovery

Interview and observe at least two segments: supplier-heavy merchants (for example stationery or kirana) and service merchants (for example salons). Ask for specific recent incidents rather than asking whether they ‘want AI’. Questions: When was a payment due before enough money arrived? How was the due date recorded? Which account held the funds? Was cash on hand available? What choices did the owner actually have? What would an earlier warning have changed? How often does this happen? What was the cost of acting late? Would the owner confirm one important obligation in the app? What alerts are already ignored?

A short diary study can record obligations and available funds over several weeks with consent. Compare Munim's proposed warnings to the owner's actual decisions, and count missing channels. This establishes whether the cash timing problem is frequent and whether the proposed data scope is sufficient. Customer service and supplier relationship impacts should be observed, not assumed.

## Model evaluation

**Recurring-obligation detector:** measure candidate precision (how often a question concerns a real upcoming payment), false labels for personal transfers, amount/date error, and merchant correction rate. A high-confidence prediction still requires confirmation unless the owner has explicitly authorised recurrence.

**Inflow forecast:** use rolling-origin backtests where only data available at each past cutoff are used. Report interval coverage, interval width, absolute error, performance by horizon and merchant segment, cold start, seasonality and missing-account coverage. Calibrate before claiming probabilities. Compare with a simple recent-weekday baseline; model complexity must earn its place.

**Gap alerts:** measure precision of material warnings, recall of confirmed gaps, lead time, false-alert burden per merchant-month, merchant action rate and action usefulness. A warning may be correct but too late to matter. Include cancelled bills and gaps resolved by cash or another provider as appropriate ground truth with coverage notes.

**Settlement follow-up:** test that it does not call normal settlement timing an error. Evaluate exception detection, time to resolution, duplicate-event handling, refund/chargeback accounting and evidence-pack completeness. Resolve against authoritative provider state when available.

**Voice:** evaluate exact amounts, dates, payee names, negation, mixed language and noisy shop recordings. The system must read back decision-critical figures. Measure human correction rate, not just transcription word error.

## Business impact experiment

Start with shadow mode: Munim predicts without notifying and compare against later outcomes. Then conduct a limited field pilot with consenting merchants. A randomised or phased rollout can compare missed or late obligations, stock-purchase interruptions, merchant time, supplier disputes and cash-related actions. Do not count every accepted alert as value. Account for subscription, model, support, settlement and financing costs. Track potentially harmful outcomes: excessive borrowing, unnecessary accelerated settlements, alert fatigue, privacy complaints and reduced trust.

The causal claim should be narrow: ‘Munim reduced avoidable late supplier payments in eligible merchants during the pilot’, if a well-designed study supports it. Do not infer extra sales or gross profit unless product-level sales and costs are observed.

## Launch gates

| Gate | Evidence required | If failed |
|---|---|---|
| Data access | Product/partner permission for exact merchant feeds and any bank integration | Remain a prototype; reduce claims |
| Merchant need | Frequent actionable cash-timing incidents in target segment | Change segment or core job |
| Low effort | Few, useful owner confirmations and low alert burden | Simplify questions, narrow triggers |
| Model calibration | Honest interval coverage across segments and horizons | Widen ranges or abstain |
| Safety | No unapproved money movement/contact; unknown external states handled | Block action deployment |
| Value | Merchant decisions improve net of time and cost | Revisit action set or pricing |
| Trust | Merchants understand visibility limits and corrections | Rewrite alerts and evidence display |

## Hackathon evaluation set

Prepare synthetic scenarios with expected results: (1) confirmed obligation and likely gap; (2) recurring transfer that is not due; (3) bank balance stale; (4) cash-heavy merchant; (5) supplier refuses split; (6) early settlement with a real timing benefit; (7) early settlement with no benefit; (8) refund after forecast; (9) duplicate settlement event; (10) loan terms unavailable; (11) noisy voice mishears 18,000 as 80,000; (12) changed due date makes warning disappear. Label the data synthetic and judge the agent on correct abstention as well as correct recommendations.
