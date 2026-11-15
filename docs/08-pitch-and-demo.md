# 08 — Hackathon pitch, story and live demo

## One-line pitch

**“Paytm Munim warns a shopkeeper about a real upcoming cash crunch, shows exactly why it may happen, and helps them act before it interrupts their business.”**

## Forty-five-second spoken pitch

“A shop can receive payments every day and still lack enough money on the morning a supplier bill is due. Most owners manage these dates in their head. Paytm Munim is an AI cash planning partner inside Paytm for Business. It notices a possible upcoming payment, asks the owner to confirm it, and combines verified money information with a cautious inflow forecast. If there may be a gap, it explains the range and prepares practical options. The owner makes the financial decision. Munim also follows up on settlements that do not arrive as expected. It does the tracking; the merchant runs the shop.”

## Why this is beyond a report

The complete loop is **candidate → merchant confirmation → forecast → warning → compared options → exact approval → follow-up → learning**. Paytm already provides reports, settlement products and AI Soundbox insights [S1–S3]. Munim's demo must show the future-oriented decision and revised action, not a chart or sales-summary chatbot.

## Five-minute demonstration

| Time | Scene | What to show |
|---|---|---|
| 0:00–0:40 | Busy shop owner | No setup wizard or daily ledger; Paytm activity already visible in synthetic connector |
| 0:40–1:15 | Candidate obligation | Munim asks whether a usual payment to Gupta Traders is due; it does not assert a bill |
| 1:15–1:50 | Owner confirmation | Owner says ₹38,000 on Thursday; read back amount and date |
| 1:50–2:40 | Cash-gap radar | Verified balance ₹10,000; expected inflows ₹11,000–₹19,000; possible ₹9,000–₹17,000 shortage; coverage label |
| 2:40–3:30 | What-if options | Consider a supplier split only as conditional; eligible settlement timing only with actual cost/timing; no default loan |
| 3:30–4:15 | Judge changes a fact | Add a connected balance or move the due date; warning recalculates or disappears |
| 4:15–4:45 | Settlement exception | One delayed event is traced with status/UTR; normal timing is not falsely flagged |
| 4:45–5:00 | Outcome | Show what was verified, what the owner confirmed, what remained forecast, and which action was actually approved |

All amounts, merchant identities and external events are synthetic. If no Paytm sandbox is available, mark simulated feeds visibly. A live judge should be allowed to alter an amount/date that was not hard-coded into the narrative.

## Demo arithmetic

The illustrative low estimate: ₹10,000 + ₹11,000 − ₹38,000 = −₹17,000. High estimate: ₹10,000 + ₹19,000 − ₹38,000 = −₹9,000. Therefore the possible gap is ₹9,000–₹17,000, assuming no other known outflows or reserve requirement. If the owner reveals ₹8,000 cash, that is an owner-supplied scenario input, not a connected-bank verification. If an additional ₹20,000 connected balance is verified, the warning may disappear. The model should recalculate with deterministic money arithmetic.

## Judge questions

**“Does Paytm already do this?”** Paytm already has AI Soundbox insights and settlement tools. Munim's proposed difference is forecasting against a confirmed due payment, presenting evidence and uncertainty, comparing feasible actions, and following the outcome. We would not claim the underlying tools are new.

**“How does it know a bill is due?”** It does not from a repeating transfer alone. It asks the merchant; only then is it a confirmed obligation.

**“What about cash or other apps?”** The alert states its data coverage. Without connected-account visibility, Munim makes a Paytm-only statement and may abstain from a full cash-gap claim.

**“Why not just offer a loan?”** A loan may cost more than a timing change and requires actual lender eligibility and consent. It is a separate option only if the merchant requests it.

**“Where is the growth?”** Earlier visibility can prevent a merchant from missing an economically sound stock purchase or breaking a supplier commitment. The demo proves the workflow; a pilot must measure business impact. We do not claim a simulated profit lift.

**“Is this globally novel?”** No. AI cash-flow agents exist. This proposal is an evidence-led, low-effort workflow for Paytm merchants. The demo is judged on its realistic action path and safe failure behaviour.

## Visual slide sequence

1. Merchant's Thursday problem: supplier due before visible cash arrives.
2. Munim asks one confirmation, then shows the cash fan chart with coverage.
3. Compare feasible responses and costs.
4. Judge changes input; recommendation changes appropriately.
5. System view: verified data, owner confirmation, forecast, action gate.
6. Validation: calibrated warnings, avoided disruption, low merchant time.

Do not use a giant agent diagram, invented 2.6× peaks, missing-profit claims, or a fake live bank integration. The decisive demo moment is a warning that is revised or withdrawn when evidence changes.
