"""
generate_data.py
----------------
Generates a synthetic student dataset with 21 features spanning
academics, finance, engagement, and wellbeing, plus a binary
'dropout' target.

This is a stand-in for real institutional data. To use real data,
export your records with the same column schema (see FEATURE_COLUMNS
below) and replace data/students.csv.

Usage:
    python data/generate_data.py --n 5000 --out data/students.csv
"""

import argparse
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "student_id",
    "age",
    "gender",
    "department",
    "semester",
    "entrance_score_pct",
    "current_gpa",
    "backlogs",
    "study_hours_per_week",
    "attendance_pct",
    "assignment_submission_rate",
    "family_income",
    "fee_payment_delay_days",
    "scholarship",
    "lms_login_frequency_per_week",
    "library_visits_per_month",
    "extracurricular_participation",
    "distance_from_home_km",
    "commute_mode",
    "mental_health_score",
    "sleep_hours_per_night",
    "disciplinary_actions",
    "dropout",
]

DEPARTMENTS = ["Computer Science", "Electrical Engineering", "Mechanical Engineering",
               "Civil Engineering", "Electronics & Communication", "Business Administration"]
COMMUTE_MODES = ["Hostel", "Walking", "Bicycle", "Public Transport", "Own Vehicle"]
GENDERS = ["Male", "Female", "Other"]


def _clip(arr, low, high):
    return np.clip(arr, low, high)


def generate_students(n=5000, seed=42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    student_id = [f"STU{100000 + i}" for i in range(n)]
    age = rng.integers(18, 25, size=n)
    gender = rng.choice(GENDERS, size=n, p=[0.55, 0.42, 0.03])
    department = rng.choice(DEPARTMENTS, size=n)
    semester = rng.integers(1, 9, size=n)

    entrance_score_pct = _clip(rng.normal(70, 12, n), 30, 100)

    # Academic performance correlates loosely with entrance score, with noise
    current_gpa = _clip(
        (entrance_score_pct / 100) * 8 + rng.normal(0, 1.6, n), 0, 10
    )
    backlogs = _clip(
        rng.poisson(lam=_clip(3.5 - current_gpa / 2, 0, None)), 0, 10
    ).astype(int)
    study_hours_per_week = _clip(rng.normal(15, 7, n), 0, 50)
    attendance_pct = _clip(rng.normal(80, 14, n) - backlogs * 1.5, 30, 100)
    assignment_submission_rate = _clip(rng.normal(85, 15, n) - backlogs * 2, 0, 100)

    family_income = _clip(rng.lognormal(mean=10.8, sigma=0.6, size=n), 60000, 5_000_000).round(-2)
    fee_payment_delay_days = _clip(
        rng.exponential(scale=10, size=n) + (1 - (family_income / family_income.max())) * 20, 0, 180
    ).astype(int)
    scholarship = (family_income < np.percentile(family_income, 30)).astype(int)

    lms_login_frequency_per_week = _clip(rng.normal(10, 5, n) - backlogs * 0.4, 0, 40)
    library_visits_per_month = _clip(rng.normal(6, 4, n), 0, 30).astype(int)
    extracurricular_participation = rng.choice([0, 1], size=n, p=[0.6, 0.4])

    distance_from_home_km = _clip(rng.exponential(scale=25, size=n), 0, 400)
    commute_mode = rng.choice(COMMUTE_MODES, size=n)

    mental_health_score = _clip(
        rng.normal(7, 2, n) - fee_payment_delay_days / 60 - backlogs * 0.15, 1, 10
    )
    sleep_hours_per_night = _clip(rng.normal(6.5, 1.3, n), 3, 10)
    disciplinary_actions = _clip(
        rng.poisson(lam=_clip(0.3 + backlogs * 0.05, 0, None)), 0, 5
    ).astype(int)

    # ---- Dropout risk: weighted logistic combination of risk-signal features ----
    z = (
        -0.55 * (current_gpa - 5)
        - 0.045 * (attendance_pct - 75)
        - 0.35 * (mental_health_score - 5)
        + 0.35 * backlogs
        + 0.015 * fee_payment_delay_days
        - 0.06 * lms_login_frequency_per_week
        + 0.4 * disciplinary_actions
        - 0.000002 * (family_income - family_income.mean())
        + rng.normal(0, 1.1, n)  # noise
    )
    prob_dropout = 1 / (1 + np.exp(-z))
    dropout = (rng.random(n) < prob_dropout).astype(int)

    df = pd.DataFrame({
        "student_id": student_id,
        "age": age,
        "gender": gender,
        "department": department,
        "semester": semester,
        "entrance_score_pct": entrance_score_pct.round(1),
        "current_gpa": current_gpa.round(2),
        "backlogs": backlogs,
        "study_hours_per_week": study_hours_per_week.round(1),
        "attendance_pct": attendance_pct.round(1),
        "assignment_submission_rate": assignment_submission_rate.round(1),
        "family_income": family_income.astype(int),
        "fee_payment_delay_days": fee_payment_delay_days,
        "scholarship": scholarship,
        "lms_login_frequency_per_week": lms_login_frequency_per_week.round(1),
        "library_visits_per_month": library_visits_per_month,
        "extracurricular_participation": extracurricular_participation,
        "distance_from_home_km": distance_from_home_km.round(1),
        "commute_mode": commute_mode,
        "mental_health_score": mental_health_score.round(1),
        "sleep_hours_per_night": sleep_hours_per_night.round(1),
        "disciplinary_actions": disciplinary_actions,
        "dropout": dropout,
    })

    return df[FEATURE_COLUMNS]


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic student dropout dataset.")
    parser.add_argument("--n", type=int, default=5000, help="Number of student records to generate.")
    parser.add_argument("--out", type=str, default="data/students.csv", help="Output CSV path.")
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()

    df = generate_students(n=args.n, seed=args.seed)
    df.to_csv(args.out, index=False)
    print(f"Generated {len(df)} student records -> {args.out}")
    print(f"Dropout rate: {df['dropout'].mean():.1%}")


if __name__ == "__main__":
    main()
