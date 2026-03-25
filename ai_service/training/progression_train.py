import os
import json
import joblib  # type: ignore

# Always resolve paths relative to the ai_service root (one level up from training/)
AI_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def train_progression_rules() -> None:
    """
    Train the disease progression model using Apriori association rules.
    - Uses the expanded historical_data.csv for transaction mining
    - min_support=0.05, min_confidence=0.3
    - Prints number of rules found + top 10 by confidence
    - Saves rules count and top rules to models/progression_metrics.json
    - Saves progression_rules.pkl to ai_service/models/
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

    # ── Build transaction dataset from both CSVs and hardcoded chains ─────────
    # Start with medically established disease chains
    hardcoded_chains = [
        ['Diabetes', 'Hypertension', 'Heart Disease'],
        ['Diabetes', 'Hypertension', 'Stroke'],
        ['Hypertension', 'Stroke'],
        ['Hypertension', 'Heart Disease'],
        ['Asthma', 'Bronchitis'],
        ['Asthma', 'Pneumonia'],
        ['Bronchitis', 'Pneumonia'],
        ['Obesity', 'Diabetes', 'Hypertension'],
        ['Obesity', 'Heart Disease'],
        ['Diabetes', 'Obesity', 'Hypertension'],
        ['Influenza', 'Bronchitis'],
        ['Influenza', 'Pneumonia'],
        ['Hypertension', 'Heart Disease', 'Stroke'],
        ['Diabetes', 'Hypertension'],
        ['Asthma', 'Allergy'],
        ['Allergy', 'Asthma'],
        ['Bronchitis', 'Pneumonia'],
        ['Diabetes', 'Heart Disease'],
        ['Hypertension', 'Stroke'],
        ['Obesity', 'Hypertension', 'Heart Disease'],
        ['Gastritis', 'Diabetes'],
        ['Anemia', 'Depression'],
        ['Depression', 'Migraine'],
        ['Migraine', 'Depression'],
        ['Arthritis', 'Depression'],
        ['Diabetes', 'Hypertension', 'Stroke'],
        ['Asthma', 'Bronchitis', 'Pneumonia'],
        ['Obesity', 'Diabetes'],
        ['Hypertension', 'Heart Disease'],
        ['Influenza', 'Bronchitis', 'Pneumonia'],
    ]

    # ── Also derive chains from CSV file ──────────────────────────────
    csv_path = os.path.join(AI_SERVICE_DIR, 'data', 'historical_data.csv')
    csv_chains = []
    if os.path.exists(csv_path):
        import pandas as pd  # type: ignore
        df = pd.read_csv(csv_path)
        print(f"[progression_train] Loading CSV: {df.shape[0]} rows")

        for _, row in df.iterrows():
            chain = []
            prev = str(row.get('previous_disease', 'None')).strip()
            chronic = str(row.get('chronic_conditions', 'None')).strip()
            target = str(row.get('target_disease', '')).strip()

            if prev and prev != 'None':
                chain.append(prev)
            if chronic and chronic != 'None' and chronic not in chain:
                chain.append(chronic)
            if target and target not in chain:
                chain.append(target)

            if len(chain) >= 2:
                csv_chains.append(chain)

        print(f"[progression_train] Derived {len(csv_chains)} transaction chains from CSV")

    all_chains = hardcoded_chains + csv_chains

    # ── Convert to one-hot binary matrix ──────────────────────────────
    te = TransactionEncoder()
    te_ary = te.fit(all_chains).transform(all_chains)
    import pandas as pd  # type: ignore
    df_onehot = pd.DataFrame(te_ary, columns=te.columns_)

    print(f"[progression_train] Transaction matrix: {df_onehot.shape[0]} transactions, {df_onehot.shape[1]} items")

    # ── Mine frequent itemsets ─────────────────────────────────────────
    frequent_itemsets = apriori(
        df_onehot,
        min_support=0.05,
        use_colnames=True,
        max_len=4
    )
    print(f"[progression_train] Frequent itemsets found: {len(frequent_itemsets)}")

    # ── Generate association rules ─────────────────────────────────────
    rules = association_rules(
        frequent_itemsets,
        metric="confidence",
        min_threshold=0.3
    )

    # Sort by confidence descending
    rules = rules.sort_values('confidence', ascending=False).reset_index(drop=True)

    total_rules = len(rules)
    print(f"[progression_train] Association rules generated: {total_rules}")

    if total_rules == 0:
        print("[progression_train] ⚠ No rules found — lowering min_support to 0.03")
        frequent_itemsets = apriori(df_onehot, min_support=0.03, use_colnames=True, max_len=4)
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.25)
        rules = rules.sort_values('confidence', ascending=False).reset_index(drop=True)
        total_rules = len(rules)
        print(f"[progression_train] Rules after adjustment: {total_rules}")

    # ── Print top 10 rules by confidence ──────────────────────────────
    print("\n[progression_train] ── Top 10 Rules by Confidence ───────────────")
    top10 = rules.head(10)
    for i, row in top10.iterrows():
        ant  = list(row['antecedents'])
        cons = list(row['consequents'])
        conf = float(row['confidence'])
        lift = float(row['lift'])
        supp = float(row['support'])
        print(f"  {i+1:2d}. {ant} → {cons}  conf={conf:.3f}  lift={lift:.3f}  supp={supp:.3f}")

    # ── Build top rules for metrics JSON ──────────────────────────────
    top_rules_json = []
    for _, row in top10.iterrows():
        top_rules_json.append({
            "antecedents": list(row['antecedents']),
            "consequents": list(row['consequents']),
            "confidence": float(f"{float(row['confidence']):.4f}"),
            "lift": float(f"{float(row['lift']):.4f}"),
            "support": float(f"{float(row['support']):.4f}"),
        })

    # ── Save metrics ───────────────────────────────────────────────────
    models_dir = os.path.join(AI_SERVICE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)

    metrics = {
        "algorithm": "Apriori (mlxtend)",
        "total_transactions": int(df_onehot.shape[0]),
        "unique_diseases": int(df_onehot.shape[1]),
        "min_support": 0.05,
        "min_confidence": 0.3,
        "total_rules_found": total_rules,
        "top_10_rules_by_confidence": top_rules_json,
        "trained_at": pd.Timestamp.now().isoformat()
    }

    metrics_path = os.path.join(models_dir, 'progression_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[progression_train] ✓ Metrics saved to: {metrics_path}")

    # ── Save rules ─────────────────────────────────────────────────────
    rules_path = os.path.join(models_dir, 'progression_rules.pkl')
    joblib.dump(rules, rules_path)

    print(f"[progression_train] ✓ {total_rules} rules saved to: {rules_path}")
    print("[progression_train] ✓ Disease Progression Model Trained Successfully!")


if __name__ == "__main__":
    train_progression_rules()
