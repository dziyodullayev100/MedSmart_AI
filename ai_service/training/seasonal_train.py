import pandas as pd  # type: ignore
import numpy as np  # type: ignore
from sklearn.ensemble import RandomForestClassifier  # type: ignore
from sklearn.preprocessing import LabelEncoder  # type: ignore
import joblib  # type: ignore
import os

# Always resolve paths relative to the ai_service root (one level up from training/)
AI_SERVICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


def train_seasonal_model(data_path: str | None = None) -> None:
    """
    Train the seasonal disease prediction model (Random Forest Classifier).
    Uses built-in sample data if the specified CSV is not found.
    Saves model artifacts to ai_service/models/.
    """
    if data_path is None:
        data_path = os.path.join(AI_SERVICE_DIR, 'data', 'historical_data.csv')

    if not os.path.exists(data_path):
        print(f"[seasonal_train] Data file not found: {data_path}")
        print("[seasonal_train] Using built-in sample training data...")
        data = {
            'age':              [35, 10, 45, 60, 25, 30,  8, 70, 20, 50,
                                 32, 12, 42,  5, 28, 33, 55, 65, 15, 40],
            'month':            [12,  6,  1,  1,  7,  8,  8,  7,  3, 11,
                                  1,  6, 12,  2,  3,  4,  9, 10,  5,  6],
            'season':           ['Winter', 'Summer', 'Winter', 'Winter',
                                 'Summer', 'Summer', 'Summer', 'Summer',
                                 'Spring', 'Autumn', 'Winter', 'Summer',
                                 'Winter', 'Winter', 'Spring', 'Spring',
                                 'Autumn', 'Autumn', 'Spring', 'Summer'],
            'previous_disease': ['None', 'Flu', 'None', 'Cough',
                                 'None', 'Allergy', 'None', 'Hypertension',
                                 'None', 'None', 'None', 'None',
                                 'Flu', 'None', 'Allergy', 'None',
                                 'None', 'Cough', 'None', 'None'],
            'disease':          ['Flu', 'Allergy', 'Flu', 'Pneumonia',
                                 'Allergy', 'Allergy', 'SkinRash', 'Heatstroke',
                                 'Allergy', 'Flu', 'Flu', 'Allergy',
                                 'Flu', 'Flu', 'Allergy', 'Allergy',
                                 'Cough', 'Pneumonia', 'Allergy', 'Heatstroke'],
        }
        df = pd.DataFrame(data)
    else:
        print(f"[seasonal_train] Loading data from: {data_path}")
        df = pd.read_csv(data_path)

    # ── Encode features ────────────────────────────────────────────────
    le_season = LabelEncoder()
    le_prev = LabelEncoder()
    le_disease = LabelEncoder()

    df['season_encoded'] = le_season.fit_transform(df['season'])
    df['prev_disease_encoded'] = le_prev.fit_transform(df['previous_disease'])
    df['disease_encoded'] = le_disease.fit_transform(df['disease'])

    # ── Train Random Forest ────────────────────────────────────────────
    X = df[['age', 'month', 'season_encoded', 'prev_disease_encoded']]
    y = df['disease_encoded']

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    # ── Save model artifacts ───────────────────────────────────────────
    models_dir = os.path.join(AI_SERVICE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)

    joblib.dump(model,     os.path.join(models_dir, 'seasonal_model.pkl'))
    joblib.dump(le_season, os.path.join(models_dir, 'le_season.pkl'))
    joblib.dump(le_prev,   os.path.join(models_dir, 'le_prev.pkl'))
    joblib.dump(le_disease, os.path.join(models_dir, 'le_disease.pkl'))

    print(f"[seasonal_train] ✓ Model saved to: {models_dir}")
    print("[seasonal_train] ✓ Seasonal Disease Prediction Model Trained Successfully!")


if __name__ == "__main__":
    train_seasonal_model()
