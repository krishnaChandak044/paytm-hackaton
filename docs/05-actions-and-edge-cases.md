# 05 — Actions, controls, failure handling and edge cases

## Action ladder

| Level | Examples | Authority |
|---|---|---|
| Observe | Read authorised transactions and settlements, detect pattern, compute forecast | Merchant data permissions and platform access |
| Prepare | Draft a question, cash scenario, support evidence pack, or supplier message | No external action yet |
| Low-risk automated follow-up | Recheck a pending status, update a forecast, suppress resolved alert | Standing rule and audit log |
| Owner-approved external action | Send supplier message, change settlement option, submit a case, initiate transfer | Specific action, amount, payee, terms and timing approved |
| Separate regulated journey | Credit application or acceptance | Customer request, lender eligibility, actual disclosures and explicit acceptance |

Paytm's own pages describe multiple settlement products [S3]. Munim should present only the options available to the particular merchant, with current cost and expected arrival. Partner loans are a separate product; Paytm says digital loans are provided by bank/NBFC partners [S5]. A forecast must not be a disguised loan sales trigger.

## Action execution design

Every plan has an immutable version and expires after a material input changes. An approval binds to merchant identity, role, action type, exact amount/payee or recipient, stated cost, deadline and plan version. Use idempotency keys so a retry cannot send two supplier messages or initiate two transfers. If an external call times out, mark status unknown and reconcile before retrying. Log attempt, response, provider reference and final state. The merchant can revoke standing low-risk authority, but a completed external money movement may not be reversible; communicate this before approval.

## Edge-case matrix

| Case | Required response |
|---|---|
| Merchant has only Paytm data | Describe Paytm inflows/settlements, not total cash or bank balance |
| Bank account sync is stale | Timestamp it, pause account-level warning, request refresh/consent restoration |
| Consent revoked | Stop retrieval and invalidate dependent plans; apply retention rules |
| Cash sales are material | Show them as missing or owner-supplied scenario input, never modelled as verified money |
| Owner uses several bank accounts | Include only connected accounts and show missing coverage |
| Business and personal spending are mixed | Avoid auto-classifying every transfer as business; ask only decision-critical questions |
| Recurring payment skipped this month | Ask whether still due; remove old pattern from active obligation list if denied |
| Supplier changes amount/date | Recalculate and require new approval |
| Supplier refuses split | Remove split plan; do not display it as available |
| Settlement is delayed but within stated cycle | Show current status and expected window; do not raise a false discrepancy |
| Settlement missing past expected cycle | Compare transaction, refund, chargeback and UTR; prepare case with evidence |
| Customer transaction pending | Exclude from available funds until final status |
| Duplicate events/reports | Reconcile by stable provider and order references; count once |
| Refund or chargeback arrives after forecast | Reforecast and explain what changed |
| Bank holiday or weekend | Use actual applicable settlement calendar and availability, not a generic T+1 guess |
| Shortfall interval overlaps zero | State uncertainty; seek a missing balance/obligation or wait for more evidence |
| Merchant is new or seasonal pattern changes | Widen range or abstain; no precise percentage |
| Credit cost or eligibility unknown | Do not quote a synthetic offer; direct to actual partner terms only on request |
| Merchant cannot act before deadline | Escalate immediately if material, with realistic consequences; do not imply a fix exists |
| Two staff members give conflicting inputs | Prefer owner-authorised record; show conflict and audit trail |
| Voice number misheard | Read back large amounts and dates before saving as confirmed |
| Customer or supplier text contains instructions to AI | Treat external text as untrusted data; action permissions remain hard-coded |
| Merchant ignores repeated warnings | Reduce noise, learn timing preference, keep high-severity alerts appropriately visible |

## Notification policy

Notify only when an obligation is confirmed, the potential shortfall is material, the data is sufficiently fresh, and there is enough lead time or urgency to act. Do not send daily reminders about the same unchanged risk. Combine related warnings, state rupees at stake and evidence source, and let the merchant snooze or dismiss. A resolved gap should trigger a brief resolution notice, not another alarm.

## Customer and supplier trust

Munim is primarily merchant-facing. It should not contact a customer about a merchant's cash problem. A supplier message is drafted with exact owner-approved text and sent only via an authorised channel. Where a human negotiation is required, Munim can prepare a call note, not impersonate agreement. Do not expose sensitive financial details in a shared Soundbox announcement at a customer-facing counter; private app display or earphone route should be considered for detailed cash alerts.

## Security controls

Authenticate owner and staff roles; require strong confirmation for money movement; segregate merchant tenants; minimise personal financial data; encrypt secrets and data; log actions without credentials; rate-limit external calls; protect against replay; and review data retention. The precise legal and technical controls require Paytm's internal architecture and counsel. A hackathon mock must never imply a real bank or supplier was contacted.
