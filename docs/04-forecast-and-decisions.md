# 04 — Forecasting and decision logic

## Target variable

The core question is available funds **at each relevant due date**, not next month's sales total. For a confirmed obligation on day D, calculate a distribution of available account funds immediately before its payment: last verified visible balance + verified incoming settlements scheduled before D + uncertain future inflows − confirmed outflows due before D − chosen reserve floor. Pending transactions, expected settlements subject to failure, cash on hand and unconnected accounts receive separate treatment and uncertainty labels.

Forecast results should distinguish **known scheduled** from **predicted**. A payment already successful but not settled has different risk from a hypothetical customer payment that has not occurred. Do not double count the same transaction as both a payment and later settlement.

## Forecast approach

Use a simple, transparent baseline before complex modelling: comparable weekdays, recent trend, known holidays and observed volatility. A probabilistic model can improve estimates when sufficient history exists; it must be backtested on historical cutoffs to avoid future information leaking into the past. Forecast per-day inflows, not just a 14-day sum, because timing is the merchant's problem. Produce low/median/high quantiles and explicitly record which channels they cover. For sparse histories, widen intervals or abstain. Peer category data may regularise a new merchant's prior but cannot substitute for evidence of that merchant's specific obligation.

Quantile intervals must be empirically calibrated on rolling historical periods, including quiet shops, festival windows and days with network disruption. An advertised 80% interval should cover roughly 80% of held-out eligible observations; report calibration by merchant segment and horizon. A mathematically narrow interval with poor coverage is unacceptable. Conformal calibration is an option only when exchangeability assumptions are reasonable; regime shifts and sparse segments must trigger wider bands or a warning.

## Obligation detection

Candidate signals include repeated payee, approximate periodicity, similar amount, transfer note and prior owner corrections. The detector estimates ‘worth asking’ rather than ‘due’. Ask only when candidate amount and timing could materially change a decision. The merchant confirms payee, amount, due date and whether a split is possible. A recurring confirmation can be authorised for a specific schedule, but the owner must be able to edit or pause it. Rent, wages and supplier purchases can change; last month's amount is not a binding future bill.

## Gap decision

Let B be the latest verified account balance, I_D the uncertain inflow before due date D, O_D confirmed earlier outflows, R the owner's reserve floor, and P the confirmed payment due on D. The projected remainder is B + I_D − O_D − R − P. A negative remainder indicates a possible shortfall *within the observed scope*. The warning should state the shortfall range, probability only if calibrated, and data missing. If the interval spans both surplus and deficit, say the outcome is uncertain and ask for a fact that would narrow it.

Illustrative synthetic case: B = ₹10,000, I_D = ₹11,000–₹19,000, O_D = ₹0 known, R = ₹0 and P = ₹38,000. Projected remainder = −₹17,000 to −₹9,000. Thus possible shortfall is ₹9,000–₹17,000 before any unobserved cash, expenses or accounts. This is not a claim about a real merchant and is not a probability interval unless tested as one.

## What-if planner

For each alternative, calculate its effects by date and display prerequisites: supplier agrees to split; settlement option is eligible and its timing/cost confirmed; purchase is truly optional; credit terms are offered by an authorised lender at an actual rate. The plan compares resulting cash range, total cost, deadline risk, and reversibility. It should not rank an unavailable loan, assume supplier consent, or claim early settlement fills a gap when those funds were already included before D.

Plans are invalidated when a critical input changes: current balance, forecast data freshness, obligation amount/date, settlement status, supplier response, eligibility, reserve floor or pricing. The owner approves a named action with exact terms, not a general ‘yes’ to an AI recommendation.

## Seasonal readiness boundaries

Future research may compare the merchant's Paytm receipt patterns during similar past weeks and show a cautious planning prompt. A peer cohort can help benchmark seasonality, but differences in category, locality, operating hours, size, cash/digital mix and promotions make causal conclusions unsafe. ‘Your digital payments were higher last festival’ is supportable; ‘you lost ₹X gross profit through stockouts’ is not without sales and inventory evidence. No synthetic-control claim should appear in the hackathon pitch without an actual design and validation.

## Model monitoring

Log forecasts, intervals, subsequent actuals, warnings, owner responses, action selection and outcomes. Monitor interval coverage, false warnings, missed material gaps, days of advance notice, scenario arithmetic error, data freshness, drift, and alert volume. Recalibrate or disable a segment when coverage degrades. Separate model accuracy from business impact: a calibrated forecast may still not change merchant decisions.
