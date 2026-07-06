"""
train_model.py
---------------
Trains a Random Forest classifier to predict student dropout risk.

Pipeline:
    - Numeric features -> StandardScaler
    - Categorical features -> OneHotEncoder
    - Classifier -> RandomForestClassifier (300 trees, class-balanced)

Trained on 80% of the data, evaluated on the remaining 20%.
Saves the full sklearn Pipeline (preprocessing + model) to
model/dropout_model.pkl so app.py can load one artifact.

Usage:
    python model/train_model.py --data data/students.csv --out model/dropout_model.pkl
"""

import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder

TARGET_COL = "dropout"
ID_COL = "student_id"

CATEGORICAL_FEATURES = ["gender", "department", "commute_mode"]
NUMERIC_FEATURES = [
    "age", "semester", "entrance_score_pct", "current_gpa", "backlogs",
    "study_hours_per_week", "attendance_pct", "assignment_submission_rate",
    "family_income", "fee_payment_delay_days", "scholarship",
    "lms_login_frequency_per_week", "library_visits_per_month",
    "extracurricular_participation", "distance_from_home_km",
    "mental_health_score", "sleep_hours_per_night", "disciplinary_actions",
]


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )

    return Pipeline(steps=[("preprocessor", preprocessor), ("classifier", model)])


def get_feature_importances(pipeline: Pipeline) -> pd.DataFrame:
    """Map Random Forest feature importances back to human-readable feature names."""
    ohe: OneHotEncoder = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    cat_names = list(ohe.get_feature_names_out(CATEGORICAL_FEATURES))
    all_names = NUMERIC_FEATURES + cat_names

    importances = pipeline.named_steps["classifier"].feature_importances_
    df = pd.DataFrame({"feature": all_names, "importance": importances})
    return df.sort_values("importance", ascending=False).reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser(description="Train the dropout prediction model.")
    parser.add_argument("--data", type=str, default="data/students.csv")
    parser.add_argument("--out", type=str, default="model/dropout_model.pkl")
    parser.add_argument("--metrics-out", type=str, default="model/metrics.json")
    args = parser.parse_args()

    df = pd.read_csv(args.data)

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[TARGET_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "f1_dropout_class": round(f1_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
    }

    print("=== Model Evaluation ===")
    for k, v in metrics.items():
        print(f"{k}: {v}")
    print("\n" + classification_report(y_test, y_pred, target_names=["No Dropout", "Dropout"]))

    importances_df = get_feature_importances(pipeline)
    print("\n=== Top 10 Feature Importances ===")
    print(importances_df.head(10).to_string(index=False))

    os.makedirs(os.path.dirname(args.out) or ".", exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipeline,
            "numeric_features": NUMERIC_FEATURES,
            "categorical_features": CATEGORICAL_FEATURES,
            "feature_importances": importances_df.to_dict(orient="records"),
            "metrics": metrics,
        },
        args.out,
    )
    print(f"\nSaved trained model -> {args.out}")

    with open(args.metrics_out, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics -> {args.metrics_out}")


if __name__ == "__main__":
    main()
