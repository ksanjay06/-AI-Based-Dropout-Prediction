"""
app.py
------
Streamlit web application for the AI-Based Student Dropout Prediction
and Counseling System.

Pages:
    1. Dashboard        - institution-wide risk-tier overview
    2. Prediction        - run a prediction for an individual student
    3. Counseling Plan    - view the AI-generated counseling plan
    4. Counselor Notes    - log & track follow-up notes
    5. Model Insights    - accuracy, feature importance

Run with:
    streamlit run app.py
"""

import os

import joblib
import pandas as pd
import streamlit as st

from utils.counseling import generate_counseling_plan
from utils.database import (
    init_db, log_prediction, get_predictions,
    add_note, get_notes, update_note_status, risk_tier_from_probability,
)

DATA_PATH = "data/students.csv"
MODEL_PATH = "model/dropout_model.pkl"

st.set_page_config(page_title="Student Dropout Prediction & Counseling", layout="wide")

TIER_COLORS = {"Low": "🟢", "Medium": "🟡", "High": "🟠", "Critical": "🔴"}


@st.cache_resource
def load_model():
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)


@st.cache_data
def load_students():
    if not os.path.exists(DATA_PATH):
        return pd.DataFrame()
    return pd.read_csv(DATA_PATH)


def predict_probability(model_bundle, student_row: pd.DataFrame) -> float:
    pipeline = model_bundle["pipeline"]
    features = model_bundle["numeric_features"] + model_bundle["categorical_features"]
    proba = pipeline.predict_proba(student_row[features])[:, 1]
    return float(proba[0])


def main():
    init_db()
    model_bundle = load_model()
    students_df = load_students()

    st.sidebar.title("🎓 Dropout Prediction System")
    page = st.sidebar.radio(
        "Navigate",
        ["Dashboard", "Prediction", "Counseling Plan", "Counselor Notes", "Model Insights"],
    )

    if model_bundle is None:
        st.warning(
            "No trained model found. Run `python data/generate_data.py` then "
            "`python model/train_model.py` first."
        )

    if page == "Dashboard":
        show_dashboard(students_df, model_bundle)
    elif page == "Prediction":
        show_prediction_page(students_df, model_bundle)
    elif page == "Counseling Plan":
        show_counseling_page(students_df)
    elif page == "Counselor Notes":
        show_notes_page(students_df)
    elif page == "Model Insights":
        show_model_insights(model_bundle)


def show_dashboard(students_df: pd.DataFrame, model_bundle):
    st.title("📊 Institution-Wide Dashboard")

    if students_df.empty:
        st.info("No student data loaded yet.")
        return

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Students", len(students_df))
    col2.metric("Average GPA", f"{students_df['current_gpa'].mean():.2f}")
    col3.metric("Average Attendance", f"{students_df['attendance_pct'].mean():.1f}%")
    col4.metric("Actual Dropout Rate", f"{students_df['dropout'].mean():.1%}")

    st.subheader("Risk Tier Distribution")
    if model_bundle is not None:
        features = model_bundle["numeric_features"] + model_bundle["categorical_features"]
        probs = model_bundle["pipeline"].predict_proba(students_df[features])[:, 1]
        tiers = pd.Series(probs).apply(risk_tier_from_probability)
        tier_counts = tiers.value_counts().reindex(["Low", "Medium", "High", "Critical"], fill_value=0)
        st.bar_chart(tier_counts)
        st.dataframe(
            pd.DataFrame({"Risk Tier": tier_counts.index, "Students": tier_counts.values})
        )
    else:
        st.info("Train the model to see live risk-tier distribution.")

    st.subheader("Department Overview")
    dept_summary = students_df.groupby("department").agg(
        students=("student_id", "count"),
        avg_gpa=("current_gpa", "mean"),
        avg_attendance=("attendance_pct", "mean"),
        dropout_rate=("dropout", "mean"),
    ).round(2)
    st.dataframe(dept_summary)


def show_prediction_page(students_df: pd.DataFrame, model_bundle):
    st.title("🔍 Individual Student Prediction")

    if students_df.empty or model_bundle is None:
        st.info("Load student data and train the model first.")
        return

    student_id = st.selectbox("Select a student", students_df["student_id"].tolist())
    student_row = students_df[students_df["student_id"] == student_id]

    if st.button("Run Prediction"):
        prob = predict_probability(model_bundle, student_row)
        tier = risk_tier_from_probability(prob)
        log_prediction(student_id, prob)

        st.session_state["last_prediction"] = {"student_id": student_id, "probability": prob, "tier": tier}

        st.metric("Predicted Dropout Risk", f"{prob:.1%}", tier)
        st.write(f"**Risk Tier:** {TIER_COLORS.get(tier, '')} {tier}")

    st.subheader("Student Profile")
    st.dataframe(student_row.T.rename(columns={student_row.index[0]: "Value"}))

    st.subheader("Prediction History")
    history = get_predictions(student_id=student_id)
    if history:
        st.dataframe(pd.DataFrame(history))
    else:
        st.caption("No predictions logged yet for this student.")


def show_counseling_page(students_df: pd.DataFrame):
    st.title("🗒️ AI-Generated Counseling Plan")

    if students_df.empty:
        st.info("No student data loaded yet.")
        return

    student_id = st.selectbox("Select a student", students_df["student_id"].tolist(), key="counseling_student")
    student_row = students_df[students_df["student_id"] == student_id].iloc[0].to_dict()

    plan = generate_counseling_plan(student_row)

    st.subheader("Flagged Risk Factors")
    if plan.risk_factors:
        st.dataframe(pd.DataFrame([rf.__dict__ for rf in plan.risk_factors]))
    else:
        st.success("No significant risk factors flagged for this student.")

    st.subheader("Recommended Interventions")
    for rec in plan.recommendations:
        priority_icon = {"Urgent": "🔴", "Recommended": "🟡", "Optional": "🟢"}.get(rec.priority, "")
        st.markdown(f"**{rec.category} ({rec.priority}) {priority_icon}:** {rec.action}")


def show_notes_page(students_df: pd.DataFrame):
    st.title("📝 Counselor Notes")

    with st.form("add_note_form"):
        st.subheader("Log a New Follow-up Note")
        student_options = students_df["student_id"].tolist() if not students_df.empty else []
        student_id = st.selectbox("Student", student_options) if student_options else st.text_input("Student ID")
        counselor_name = st.text_input("Counselor Name")
        note_text = st.text_area("Note")
        status = st.selectbox("Status", ["Open", "In Progress", "Resolved"])
        submitted = st.form_submit_button("Save Note")

        if submitted and note_text.strip():
            add_note(student_id, note_text, counselor_name, status)
            st.success("Note saved.")

    st.subheader("All Notes")
    status_filter = st.selectbox("Filter by status", ["All", "Open", "In Progress", "Resolved"])
    notes = get_notes(status=None if status_filter == "All" else status_filter)

    if not notes:
        st.caption("No notes logged yet.")
        return

    for note in notes:
        with st.expander(f"{note['student_id']} — {note['status']} ({note['created_at'][:10]})"):
            st.write(note["note"])
            st.caption(f"Counselor: {note['counselor_name'] or 'Unassigned'}")
            new_status = st.selectbox(
                "Update status", ["Open", "In Progress", "Resolved"],
                index=["Open", "In Progress", "Resolved"].index(note["status"]),
                key=f"status_{note['id']}",
            )
            if st.button("Update", key=f"update_{note['id']}"):
                update_note_status(note["id"], new_status)
                st.rerun()


def show_model_insights(model_bundle):
    st.title("📈 Model Insights")

    if model_bundle is None:
        st.info("Train the model first: `python model/train_model.py`.")
        return

    st.subheader("Evaluation Metrics")
    st.json(model_bundle["metrics"])

    st.subheader("Top 10 Feature Importances")
    importances_df = pd.DataFrame(model_bundle["feature_importances"]).head(10)
    st.bar_chart(importances_df.set_index("feature"))
    st.dataframe(importances_df)


if __name__ == "__main__":
    main()
