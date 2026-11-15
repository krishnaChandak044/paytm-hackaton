# 02 — Merchant experience and feature specifications

## One ordinary week

The merchant accepts Paytm payments as usual. Munim observes only authorised data. It may detect a recurring transfer to a known counterparty but stores it as **possible upcoming obligation**. If a material decision depends on that pattern, it asks at a quiet time: “Is a payment due to Gupta Traders this Thursday? If yes, how much?” The owner answers in a short voice or tap interaction. The confirmed date and amount become an obligation with an expiry and an owner-confirmation trail.

If connected account data is available and current, Munim estimates money available immediately before the due date. It includes verified balance and settled or realistically forecast inflows, subtracts confirmed earlier obligations, and respects a merchant-chosen minimum buffer. It then shows one concise result with an uncertainty interval and missing-data warning. At the owner's request, it compares possible responses. After the due date, Munim observes whether the obligation appears paid in a connected account or asks for a lightweight status confirmation if it cannot know.

## Feature A: cash-gap radar

**Trigger:** a confirmed obligation of material size falls within the look-ahead window, and the predicted available-funds range suggests a potential gap. The first prototype can use a 7–14 day window as a design hypothesis; field testing should determine a useful horizon.

**Inputs:** confirmed amount and due date; current visible balance if available; Paytm settlement timing and status; consented bank transactions where available; earlier confirmed obligations; merchant reserve floor; forecast of inflows with calibration and freshness.

**Output:** “₹38,000 confirmed due Thursday; ₹10,000 currently visible; ₹11,000–₹19,000 expected to arrive before then; possible shortfall ₹9,000–₹17,000 before other unobserved cash and expenses.” A wider interval or missing account can force a weaker message: “I cannot estimate your full cash position; this is a Paytm-only view.”

**Merchant time:** no daily entries. Confirm a material obligation only when useful; add or edit one with voice if desired. Limit routine questions through a configurable frequency cap, but never hide a material verified deadline solely to satisfy that cap.

**Abstention:** if balance data is stale, incoming forecast uncalibrated, obligation unconfirmed, or the coverage gap dominates the estimate, show a question or a limited informational view rather than a confident shortfall claim.

## Feature B: what-if planner

The owner can ask “What if Gupta lets me pay half on Thursday?” or “What if I buy ₹8,000 less stock?” Munim recomputes the date-by-date cash range and presents consequences. Scenarios are plans, not executed transactions. The action list is ordered by feasibility and total cost, not by Paytm revenue.

Possible actions: clarify or reschedule a supplier payment; use already eligible settlement timing if it genuinely changes funds available before the deadline; reduce a planned purchase; move an optional spend; arrange an explicitly requested financing review with a partner lender. Supplier contact, settlement selection with cost, money movement, and financing each need the exact action and terms reviewed by the merchant. If two actions have identical net cash impact, say so.

**No false cure:** If a settlement was already expected before the due date, accelerating it does not close the projected gap. If a supplier will not accept a split, the plan cannot treat that split as agreed. If the owner has insufficient verified data, show the scenario as conditional.

## Feature C: settlement and payment follow-up

Munim matches eligible Paytm transactions to settlement records and references. It can surface an unresolved item with amount, status, expected timing, latest check, and next action. Paytm documentation describes settlement reports and UTR references [S2]. A discrepancy must account for known fees, refunds, chargebacks, settlement cycle, bank holidays, and provider-specific state. The agent prepares evidence for a support case; submission depends on available internal access and merchant authority.

The merchant sees “Payment succeeded, settlement pending within stated cycle” rather than an alarming missing-money label. A pending customer payment is not counted as available cash. Duplicate webhooks or reports must not create duplicate receipts.

## Feature D: optional seasonal readiness

This is explicitly later-stage. Munim can compare the merchant's own past Paytm payment activity around a calendar period and ask: “Do you expect higher purchasing needs this week?” It cannot infer SKU stockouts, gross profit missed, or an exact needed loan. Once the owner supplies an actual purchase amount and supplier quote, the what-if planner can assess timing. Peer cohorts may add context only as aggregated, observational evidence.

## Interface

The primary surface is Paytm for Business: one card showing the confirmed obligation, possible gap, why, visibility limits, and three choices: **See options**, **Correct details**, **Dismiss**. Soundbox voice could complement the app only if Paytm provides an appropriate integration. No public general Soundbox developer interface is assumed. A quiet-hours policy prevents repetitive nudges during peak trade.

## Example conversation

**Munim:** “You usually pay Gupta Traders around this date. Is anything due this Thursday?”

**Merchant:** “Thirty-eight thousand.”

**Munim:** “I recorded ₹38,000 for Thursday. I can see your connected account balance and Paytm receipts, but not cash held at the shop. With the money currently visible and expected inflows, you may be ₹9,000–₹17,000 short. Would you like options?”

**Merchant:** “What if I pay ₹20,000 now?”

**Munim:** “That leaves ₹18,000 unpaid. I can show the cash effect, but Gupta Traders has not agreed to a split. Shall I prepare a message for your review?”

No transfer, supplier message, or credit application occurs from this conversation alone.
