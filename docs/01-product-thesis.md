# 01 — Product thesis and positioning

## The merchant problem

Money received and money available at the right time are different. A shop may collect steadily yet struggle on the day a supplier, rent, wage, or utility payment falls due. The owner often holds obligations in memory, knows only part of incoming cash, and responds late by buying less, delaying a supplier, or seeking costly short-term funds. A payment dashboard and settlement report help inspect the past; the merchant needs a small number of timely, explainable decisions about the near future.

Munim addresses **timing and coordination**, not full bookkeeping. Its primary job: “Will my visible funds and plausible inflows cover this confirmed payment by its due date, while maintaining my chosen buffer?” Its second job: “Is money I expected from a Paytm payment or settlement missing or delayed, and what is its verified status?”

Paytm already offers multilingual AI Soundbox business insights, payment tracking, settlement options and reports [S1–S3]. Therefore the novelty claim is not ‘ask sales questions in Hindi’ or ‘view settlements’. The proposed step forward is a closed decision loop: identify a possible upcoming obligation, get confirmation, forecast with coverage and uncertainty, compare realistic actions, request approval, and follow up on what actually happened.

## Primary user

An owner-operated shop that accepts Paytm payments and makes recurring supplier purchases. The owner has limited time for financial administration, may mix cash and digital transactions, and may not keep formal written accounts. The product should be usable with a single confirmed upcoming obligation. It must not require item-level inventory, receipts, uploaded bank statements, or daily data entry.

Other segments can benefit differently: a salon may have rent and payroll timing; a small cafe may have ingredient purchases; a mobile repair business may need parts deposits. Munim does not claim every merchant has an equally frequent cash-gap problem. Market eligibility and value must be measured by segment.

## Product promise and non-goals

**Promise:** provide early warning of a material, evidence-backed shortfall and a clear choice of responses, in the owner's language, without another register.

**Non-goals for first release:** complete accounting, GST filing, guaranteed loan eligibility, automatic borrowing, inferred SKU stockouts, precise lost-profit estimates, full cash visibility without account access, automated supplier negotiation, and claims about all cash or other-provider transactions from Paytm data alone.

## Scope tiers

| Tier | Inputs | Valid output | Invalid output |
|---|---|---|---|
| Paytm-only | Eligible Paytm receipts, refunds, settlement schedules/status, merchant-confirmed obligations | Paytm inflow timing, unsettled amount, possible gap within observed Paytm scope | ‘Total bank cash’, ‘all sales’, ‘you definitely cannot pay’ |
| Connected accounts | Above plus consented, current account balances and transactions through eligible integration | Account-level available-funds estimate, subject to coverage and missing cash | Complete business balance if accounts/cash are missing |
| Operationally enriched | Above plus owner-confirmed supplier bill, reserve floor, optional purchase plan | Specific what-if options and safer purchasing decisions | Exact profit or stock availability without cost/inventory data |

The user interface always displays tier, data freshness, visible accounts, missing channels, and whether an obligation is merchant-confirmed.

## What ‘growth’ means here

Munim does not promise exponential sales. It can help a merchant avoid missing a viable stock purchase or losing time to a late payment, which may preserve sales and supplier trust. A later seasonal-readiness module could ask the owner to verify stock plans when past Paytm volume suggests a peak, but it cannot infer a stockout from payment patterns alone. Actual incremental business effect requires a field comparison and careful cost accounting.

## Competitive truth

AI cash-flow tools already exist. RazorpayX announced agents for payouts, collections and cash flow in 2026 [S7]. Munim's opportunity is a trusted, low-effort workflow for Paytm's small merchants, with explicit evidence boundaries and action through eligible merchant surfaces. Do not call it the first AI accountant, first cash forecast, or a guaranteed hackathon winner.

## Success conditions

Munim succeeds if merchants receive accurate, timely, useful warnings; rarely have to answer questions; choose better actions; and experience fewer avoidable payment or purchasing disruptions. It fails if it warns from incomplete data without a coverage label, treats recurring payments as confirmed bills, pushes credit as the default answer, or creates enough alerts that the owner stops listening.
