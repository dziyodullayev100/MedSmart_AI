import os
import joblib  # type: ignore

# Always resolve paths relative to the ai_service root (one level up from training/)
AI_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def train_progression_rules() -> None:
    """
    Train the disease progression model using Apriori association rules.
    Uses historical medical disease chain data.
    Saves progression_rules.pkl to ai_service/models/.
    """
    try:
        import pandas as pd  # type: ignore
        from mlxtend.frequent_patterns import apriori, association_rules  # type: ignore
        from mlxtend.preprocessing import TransactionEncoder  # type: ignore
    except ImportError as e:
        print(f"[progression_train] ✗ Missing dependency: {e}")
        print("[progression_train]   Run: pip install mlxtend pandas")
        raise

    print("[progression_train] Training Disease Progression Rules (Apriori)...")

    # ── Medical disease chain dataset ─────────────────────────────────
    # Each list represents a patient's disease history chain
    data = [
        ['Diabetes', 'Hypertension', 'HeartDisease'],
        ['Diabetes', 'KidneyFailure', 'VisionLoss'],
        ['Hypertension', 'Stroke'],
        ['Diabetes', 'Hypertension', 'Stroke'],
        ['Flu', 'Pneumonia', 'Bronchitis'],
        ['Cold', 'Flu'],
        ['Obesity', 'Diabetes', 'Hypertension'],
        ['Hypertension', 'HeartDisease', 'Stroke'],
        ['Diabetes', 'HeartDisease'],
        ['Flu', 'Pneumonia'],
        ['Obesity', 'HeartDisease'],
        ['Diabetes', 'Obesity', 'Hypertension', 'KidneyFailure'],
        ['Hypertension', 'KidneyFailure'],
        ['Cold', 'Pneumonia'],
        ['Allergy', 'Asthma'],
        ['Asthma', 'Pneumonia'],
    ]

    # ── Convert to one-hot binary matrix ──────────────────────────────
    te = TransactionEncoder()
    te_ary = te.fit(data).transform(data)
    df = pd.DataFrame(te_ary, columns=te.columns_)

    # ── Mine frequent itemsets ─────────────────────────────────────────
    frequent_itemsets = apriori(df, min_support=0.1, use_colnames=True)

    # ── Generate association rules ─────────────────────────────────────
    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)

    # ── Save rules ─────────────────────────────────────────────────────
    models_dir = os.path.join(AI_SERVICE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)

    rules_path = os.path.join(models_dir, 'progression_rules.pkl')
    joblib.dump(rules, rules_path)

    print(f"[progression_train] ✓ Generated {len(rules)} association rules.")
    print(f"[progression_train] ✓ Rules saved to: {rules_path}")
    print("[progression_train] ✓ Disease Progression Model Trained Successfully!")


if __name__ == "__main__":
    train_progression_rules()
