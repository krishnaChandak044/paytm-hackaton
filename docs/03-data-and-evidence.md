# 03 — Data, evidence, consent and provenance

## Core principle

Munim must never make a stronger statement than its data supports. Every number has a source, timestamp, coverage scope and evidence class. The interface distinguishes **verified**, **merchant-confirmed**, **inferred candidate**, and **forecast**. A model label is not a financial fact.

## Data catalogue

| Data | Possible source | Status in product | What it can establish | What it cannot establish |
|---|---|---|---|---|
| Paytm payment event | Eligible Paytm merchant records | Integration-dependent | Amount, status and timing of that payment | Item sold, gross margin, full business turnover |
| Settlement event / UTR | Eligible Paytm settlement record | Documented for relevant products [S2] | Settlement amount, status, reference and timing | Current bank balance without bank access |
| Refund / chargeback | Eligible Paytm records | Integration-dependent | A possible deduction or reversal | All future liabilities |
| Merchant-confirmed obligation | Owner response in app/voice | Product-owned | Stated amount and date, subject to owner correction | Whether supplier accepted altered terms |
| Recurring payment candidate | Pattern in authorised outflows | Model inference | A question worth asking | A confirmed bill or due date |
| Connected bank balance/transactions | Eligible Account Aggregator or partner with explicit consent | Optional; partner-dependent | Account-specific visible balance and activity | Cash on hand or unconnected accounts |
| Cash on hand | Owner-supplied amount, if offered | Unverified user statement | Scenario input with date | Provider-verified cash balance |
| Supplier quote | Owner-supplied or approved supplier channel | Optional evidence | Quoted cost/terms if fresh and confirmed | Delivery or price guarantee without supplier acceptance |
| Peer aggregates | Explicitly approved, privacy-preserving analysis | Later | Contextual comparison | Causal proof, SKU demand, individual shop profit |

Public Paytm documentation describes transaction and settlement reports, including UTR references for applicable products [S2]. It does not give a hackathon team blanket internal data access. The system design therefore separates *data that exists in a product* from *data this project is authorised to read*.

## Consent and control

Account Aggregator information requires a valid explicit-consent flow, purpose and duration, and revocation handling under RBI directions [S4]. Munim's account-connected mode is unavailable until an eligible financial information user arrangement and integration exist. Consent to inspect account information does not authorise transfer, borrowing, supplier contact, or marketing. The merchant can inspect connected sources, refresh status, disconnect them, and see which warnings depend on each source.

Use the minimum data needed for a forecast. Separate business and personal transfers where possible; never expose personal counterparties to staff roles without permission. Protect supplier relationships and transaction records as sensitive merchant data. Retain raw voice only for a justified, short review period; store structured confirmed facts with auditable provenance. Apply tenant isolation, access control, encryption, audit logs and deletion rules suited to the actual platform.

## Event and entity model

**Merchant:** Paytm merchant identifier, category if verified, settlement product, time zone, alert preferences, authorised roles, approved reserve floor. **Account connection:** institution, account token, consent purpose, freshness, coverage start/end, revocation state. **Money event:** source ID, direction, amount in paise, currency, event time, value date, status, source, counterparty token, reconciliation links. **Obligation:** payee token, amount, due date, confirmation state, origin evidence, confirmed-by, last updated, recurrence hypothesis, reminder state. **Forecast:** creation time, input versions, model version, forecast horizon, per-day quantiles, uncertainty/coverage flags. **Action plan:** alternative, exact financial effect, assumptions, costs, eligibility, approval and expiry. **Resolution case:** disputed amount, evidence references, status, next check, owner action.

No payment event is duplicated when a report or webhook repeats. A pending transaction is not equivalent to settled cash. A payment outflow that looks recurring remains a candidate until the owner confirms a future obligation. If the owner changes the due date, old warning and plan versions become stale.

## Counterparty classification

Timing, amounts, payee descriptions and known merchant category can suggest whether an outflow is to a supplier, landlord, staff member, utility or lender. The classifier may be wrong: a family transfer can look regular, and a supplier can be paid irregularly. Use it to prioritise a question, not to label a personal payment as a business obligation automatically. The merchant can correct a label; corrections affect future suggestions but preserve prior source evidence.

## Coverage scorecard

Every forecast displays: linked accounts, latest successful sync, percent of observed Paytm receipts in the selected period that reached settlement, known unconnected channels, cash-on-hand status, count and value of confirmed obligations, and whether known costs are complete. A numeric ‘coverage score’ should only be shown if calibrated against actual completeness; otherwise use plain labels such as ‘Paytm-only’ and ‘one connected bank account’.

If a connected account is stale or consent expires, dependent cash-gap warnings are withdrawn or downgraded. The merchant must not see an old available balance without its timestamp.
