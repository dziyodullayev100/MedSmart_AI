import pandas as pd  # type: ignore
import numpy as np  # type: ignore
import json
import os
from sklearn.ensemble import RandomForestClassifier  # type: ignore
from sklearn.preprocessing import LabelEncoder  # type: ignore
from sklearn.model_selection import train_test_split, cross_val_score  # type: ignore
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report  # type: ignore
import joblib  # type: ignore

# Always resolve paths relative to the ai_service root (one level up from training/)
AI_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def train_seasonal_model(data_path: str | None = None) -> None:
    """
    Train the seasonal disease prediction model (Random Forest Classifier).
    - Loads expanded historical_data.csv (520+ rows)
    - 80/20 train/test split
    - 5-fold cross-validation
    - Saves accuracy, precision, recall, F1 to models/seasonal_metrics.json
    - Saves model artifacts to ai_service/models/
    """
    if data_path is None:
        data_path = os.path.join(AI_SERVICE_DIR, 'data', 'historical_data.csv')

    if not os.path.exists(data_path):
        print(f"[seasonal_train] ✗ Data file not found: {data_path}")
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    print(f"[seasonal_train] Loading data from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"[seasonal_train] Dataset shape: {df.shape}")

    # ── Validate required columns ──────────────────────────────────────
    required_cols = {'age', 'month', 'season', 'previous_disease', 'target_disease'}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in dataset: {missing}")

    # ── Encode features ────────────────────────────────────────────────
    le_season  = LabelEncoder()
    le_prev    = LabelEncoder()
    le_disease = LabelEncoder()

    df['season_encoded']       = le_season.fit_transform(df['season'])
    df['prev_disease_encoded'] = le_prev.fit_transform(df['previous_disease'])
    df['disease_encoded']      = le_disease.fit_transform(df['target_disease'])

    X = df[['age', 'month', 'season_encoded', 'prev_disease_encoded']].values
    y = df['disease_encoded'].values

    print(f"[seasonal_train] Features: {X.shape}, Classes: {len(le_disease.classes_)}")
    print(f"[seasonal_train] Disease classes: {list(le_disease.classes_)}")

    # ── Train / Test Split (80/20) ─────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"[seasonal_train] Train samples: {len(X_train)}, Test samples: {len(X_test)}")

    # ── Train Random Forest ────────────────────────────────────────────
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # ── Evaluate on test set ───────────────────────────────────────────
    y_pred = model.predict(X_test)

    accuracy  = float(accuracy_score(y_test, y_pred))
    precision = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
    recall    = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
    f1        = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))

    print("\n[seasonal_train] ── Evaluation on Test Set ──────────────────")
    print(f"  Accuracy : {accuracy:.4f}  ({accuracy*100:.2f}%)")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall   : {recall:.4f}")
    print(f"  F1-Score : {f1:.4f}")
    print("\n[seasonal_train] Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le_disease.classes_, zero_division=0))

    # ── 5-Fold Cross-Validation ────────────────────────────────────────
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy', n_jobs=-1)
    cv_mean   = float(np.mean(cv_scores))
    cv_std    = float(np.std(cv_scores))

    print(f"[seasonal_train] Cross-Validation (5-fold):")
    print(f"  Scores : {np.round(cv_scores, 4).tolist()}")
    print(f"  Mean   : {cv_mean:.4f} ± {cv_std:.4f}")

    # ── Save evaluation metrics ────────────────────────────────────────
    models_dir = os.path.join(AI_SERVICE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)

    metrics = {
        "model": "RandomForestClassifier",
        "dataset_rows": int(df.shape[0]),
        "num_classes": int(len(le_disease.classes_)),
        "disease_classes": list(le_disease.classes_),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "accuracy": float(np.round(accuracy, 4)),
        "precision_weighted": float(np.round(precision, 4)),
        "recall_weighted": float(np.round(recall, 4)),
        "f1_weighted": float(np.round(f1, 4)),
        "cv_5fold_scores": np.round(cv_scores, 4).tolist(),
        "cv_mean": float(np.round(cv_mean, 4)),
        "cv_std": float(np.round(cv_std, 4)),
        "n_estimators": 200,
        "trained_at": pd.Timestamp.now().isoformat()
    }

    metrics_path = os.path.join(models_dir, 'seasonal_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"[seasonal_train] ✓ Metrics saved to: {metrics_path}")

    # ── Save model artifacts ───────────────────────────────────────────
    joblib.dump(model,      os.path.join(models_dir, 'seasonal_model.pkl'))
    joblib.dump(le_season,  os.path.join(models_dir, 'le_season.pkl'))
    joblib.dump(le_prev,    os.path.join(models_dir, 'le_prev.pkl'))
    joblib.dump(le_disease, os.path.join(models_dir, 'le_disease.pkl'))

    print(f"[seasonal_train] ✓ Model artifacts saved to: {models_dir}")
    print("[seasonal_train] ✓ Seasonal Disease Prediction Model Trained Successfully!")


if __name__ == "__main__":
    train_seasonal_model()
