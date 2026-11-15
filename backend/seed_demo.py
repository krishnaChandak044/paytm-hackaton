import random
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path

src_path = str(Path(__file__).resolve().parent / "src")
if src_path not in sys.path:
    sys.path.insert(0, src_path)

from munim.db import SessionLocal, init_db
from munim.models import Merchant, Obligation
from munim.schemas import BalanceIn, MerchantCreate, MoneyEventIn, ObligationIn
from munim.service import (
    create_merchant,
    create_obligation,
    ingest_balance,
    ingest_money_event,
)


def seed():
    init_db()
    with SessionLocal() as db:
        merchant_id = "shop1"
        merchant = db.get(Merchant, merchant_id)
        if not merchant:
            merchant = create_merchant(
                db,
                MerchantCreate(id=merchant_id, name="Sharma General Store"),
            )
            print("Created merchant: Sharma General Store (shop1)")

        # Create Gupta Traders obligation: ₹38,000 due in 4 days
        today = datetime.now(UTC).date()
        target_date = today + timedelta(days=4)
        
        existing_obl = (
            db.query(Obligation)
            .filter_by(merchant_id=merchant_id, payee="Gupta Traders")
            .first()
        )
        if not existing_obl:
            obl = create_obligation(
                db,
                merchant_id,
                ObligationIn(
                    payee="Gupta Traders",
                    amount_paise=3800000,  # ₹38,000
                    due_date=target_date,
                ),
            )
            print(f"Created confirmed obligation: Gupta Traders, ₹38,000 due {target_date} (id={obl.id})")
        else:
            existing_obl.amount_paise = 3800000
            existing_obl.due_date = target_date
            existing_obl.status = "confirmed"
            existing_obl.version += 1
            existing_obl.confirmed_at = datetime.now(UTC)
            db.commit()

        # Ingest fresh balance: ₹10,000 observed 15 minutes ago
        now = datetime.now(UTC)
        ingest_balance(
            db,
            BalanceIn(
                merchant_id=merchant_id,
                account_id="acct_sbi_4912",
                amount_paise=1000000,  # ₹10,000
                observed_at=now - timedelta(minutes=15),
                consent_active=True,
            ),
        )
        print("Ingested balance snapshot: ₹10,000 on acct_sbi_4912 (15 mins ago)")

        # Ingest 8 weeks of synthetic weekday credits: ₹2,500 to ₹4,800
        random.seed(42)
        events_created = 0
        for day_offset in range(1, 57):
            event_time = now - timedelta(days=day_offset)
            # Skip Sundays for typical wholesale/retail bank credit pattern
            if event_time.weekday() == 6:
                continue
            
            amount = random.randint(250000, 480000)
            try:
                _, created = ingest_money_event(
                    db,
                    MoneyEventIn(
                        merchant_id=merchant_id,
                        source_event_id=f"hist-credit-{day_offset}",
                        source="synthetic_bank",
                        account_id="acct_sbi_4912",
                        kind="bank_credit",
                        status="success",
                        amount_paise=amount,
                        occurred_at=event_time,
                        counterparty="Paytm Merchant Settlement",
                    ),
                )
                if created:
                    events_created += 1
            except Exception:
                pass

        print(f"Ingested {events_created} historical weekday credit events")

        # Ingest recurring bank debits for Amul Milk (monthly ~₹4,500)
        for idx, days_ago in enumerate([115, 85, 55, 25]):
            event_time = now - timedelta(days=days_ago)
            try:
                ingest_money_event(
                    db,
                    MoneyEventIn(
                        merchant_id=merchant_id,
                        source_event_id=f"amul-debit-{idx}",
                        source="synthetic_bank",
                        account_id="acct_sbi_4912",
                        kind="bank_debit",
                        status="success",
                        amount_paise=450000,  # ₹4,500
                        occurred_at=event_time,
                        counterparty="Amul Milk Depot",
                    ),
                )
            except Exception:
                pass
        print("Ingested recurring monthly debits for Amul Milk Depot")

        # Additional synthetic patterns: purpose is only a hint until merchant confirms.
        for pattern, counterparty, amount in [
            ("rent", "Shop Rent Landlord", 1500000),
            ("emi", "Business Loan Finance EMI", 920000),
            ("family", "Family Transfer Ravi", 600000),
        ]:
            for idx, days_ago in enumerate([115, 85, 55, 25]):
                try:
                    ingest_money_event(
                        db,
                        MoneyEventIn(
                            merchant_id=merchant_id,
                            source_event_id=f"{pattern}-debit-{idx}",
                            source="synthetic_bank",
                            account_id="acct_sbi_4912",
                            kind="bank_debit",
                            status="success",
                            amount_paise=amount,
                            occurred_at=now - timedelta(days=days_ago),
                            counterparty=counterparty,
                        ),
                    )
                except Exception:
                    pass
        print("Ingested rent, possible EMI, and ambiguous family transfer patterns")

        # Ingest 1 unmatched payment for settlement exception tracker
        try:
            ingest_money_event(
                db,
                MoneyEventIn(
                    merchant_id=merchant_id,
                    source_event_id="unsettled-pay-1",
                    source="synthetic_paytm",
                    kind="paytm_payment",
                    status="success",
                    amount_paise=185000,  # ₹1,850
                    occurred_at=now - timedelta(hours=14),
                    reference="PTM-ORD-88102",
                ),
            )
            print("Ingested unmatched demo payment: ₹1,850")
        except Exception:
            pass

        # Second fully independent merchant profile for the shop-switch demo.
        # All records are synthetic and remain isolated by merchant_id.
        second_id = "shop2"
        second_name = "Mehta Provision Store"
        if not db.get(Merchant, second_id):
            create_merchant(db, MerchantCreate(id=second_id, name=second_name))
            print(f"Created merchant: {second_name} ({second_id})")

        second_due = today + timedelta(days=3)
        second_obligation = (
            db.query(Obligation)
            .filter_by(merchant_id=second_id, payee="Asha Wholesale")
            .first()
        )
        if not second_obligation:
            create_obligation(
                db,
                second_id,
                ObligationIn(
                    payee="Asha Wholesale",
                    amount_paise=2400000,
                    due_date=second_due,
                ),
            )
            print(f"Created confirmed obligation: Asha Wholesale, ₹24,000 due {second_due}")
        else:
            second_obligation.amount_paise = 2400000
            second_obligation.due_date = second_due
            second_obligation.status = "confirmed"
            second_obligation.version += 1
            second_obligation.confirmed_at = datetime.now(UTC)
            db.commit()

        second_account = "acct_hdfc_7731"
        ingest_balance(
            db,
            BalanceIn(
                merchant_id=second_id,
                account_id=second_account,
                amount_paise=800000,
                observed_at=now - timedelta(minutes=12),
                consent_active=True,
            ),
        )
        random.seed(99)
        second_events = 0
        for day_offset in range(1, 57):
            event_time = now - timedelta(days=day_offset)
            if event_time.weekday() == 6:
                continue
            amount = random.randint(140000, 320000)
            try:
                _, created = ingest_money_event(
                    db,
                    MoneyEventIn(
                        merchant_id=second_id,
                        source_event_id=f"shop2-hist-credit-{day_offset}",
                        source="synthetic_bank",
                        account_id=second_account,
                        kind="bank_credit",
                        status="success",
                        amount_paise=amount,
                        occurred_at=event_time,
                        counterparty="Paytm Merchant Settlement",
                    ),
                )
                second_events += int(created)
            except Exception:
                pass

        for pattern, counterparty, amount in [
            ("shop2-rent", "Store Rent Owner", 850000),
            ("shop2-dairy", "Dairy Supplier", 320000),
            ("shop2-emi", "Equipment Finance EMI", 680000),
            ("shop2-family", "Personal Transfer Amit", 500000),
        ]:
            for idx, days_ago in enumerate([115, 85, 55, 25]):
                try:
                    ingest_money_event(
                        db,
                        MoneyEventIn(
                            merchant_id=second_id,
                            source_event_id=f"{pattern}-{idx}",
                            source="synthetic_bank",
                            account_id=second_account,
                            kind="bank_debit",
                            status="success",
                            amount_paise=amount,
                            occurred_at=now - timedelta(days=days_ago),
                            counterparty=counterparty,
                        ),
                    )
                except Exception:
                    pass

        try:
            ingest_money_event(
                db,
                MoneyEventIn(
                    merchant_id=second_id,
                    source_event_id="shop2-unsettled-pay-1",
                    source="synthetic_paytm",
                    kind="paytm_payment",
                    status="success",
                    amount_paise=267000,
                    occurred_at=now - timedelta(hours=9),
                    reference="PTM-ORD-55261",
                ),
            )
        except Exception:
            pass
        print(f"Prepared {second_name}: ₹8,000 demo balance, ₹24,000 supplier due, {second_events} historical credits")

    print("\n✅ Seed complete! Ready for live pitch demo.")


if __name__ == "__main__":
    seed()
