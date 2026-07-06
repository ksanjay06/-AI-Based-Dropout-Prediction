# 🎓 AI-Based Student Dropout Prediction and Counseling System

A machine learning system for early dropout risk detection and explainable student counseling.

Student dropout is a persistent challenge for higher-education institutions. Warning signs — declining grades, poor attendance, delayed fee payments, reduced engagement, wellbeing concerns — usually appear long before a student actually leaves, but these signals are scattered across departments (academics, accounts, hostel, counseling cell) and rarely combined. This project consolidates those signals, predicts dropout risk with a trained ML model, and converts that prediction into a clear, explainable counseling plan that academic staff can act on immediately.

---

## 📌 Objectives

- Predict dropout risk for each student using a supervised classification model trained on academic, financial, engagement, and wellbeing features.
- Categorize students into risk tiers (**Low, Medium, High, Critical**) so institutions can prioritize limited counseling resources.
- Automatically generate explainable, rule-based counseling recommendations tied to each student's specific risk factors.
- Provide an interactive dashboard for administrators and a note-tracking system for counselors to log follow-up actions.

---

## 🏗️ System Architecture

The system follows a linear pipeline:

```
Student Records → Data Layer → Preprocessing → Random Forest Classifier → Trained Model
      → Risk Probability + Risk Tier → Counseling Rule Engine → Prioritized Recommendations
      → Streamlit Web Application ⇄ SQLite Database → Academic Staff / Counselors
```

Raw student data is preprocessed and fed into a trained classification model, which outputs a risk probability. This probability, along with the student's raw feature values, is passed to a rule-based counseling engine that identifies specific risk factors and generates prioritized recommendations. Everything is exposed through a **Streamlit** web application backed by a lightweight **SQLite** database for logging predictions and counselor notes.

---

## 🧩 Module Overview

| Module | File(s) | Description |
|---|---|---|
| **Data Layer** | `data/generate_data.py`, `students.csv` | Provides student records with 21 features spanning academics, finances, engagement, and wellbeing. Ships with a synthetic dataset (5,000 records) that can be replaced with real anonymized institutional data using the same schema. |
| **Preprocessing** | `model/train_model.py` | Scales numeric features (`StandardScaler`) and one-hot encodes categorical features (gender, department, commute mode) via a scikit-learn `ColumnTransformer`. |
| **Prediction Model** | `model/train_model.py`, `dropout_model.pkl` | A Random Forest Classifier (300 trees, class-balanced) trained on 80% of the data and evaluated on the remaining 20%. Outputs a dropout probability (0–1) for each student. |
| **Counseling Engine** | `utils/counseling.py` | A transparent, rule-based module that compares a student's values against population norms and thresholds to flag specific risk factors (e.g., Low GPA, Low Attendance, Wellbeing Concern), then maps each factor to a concrete, prioritized intervention across five categories: Academic, Attendance, Engagement, Wellbeing, and Financial. |
| **Persistence Layer** | `utils/database.py` | A SQLite database that logs every prediction run and stores counselor follow-up notes with a status (Open / In Progress / Resolved) for tracking accountability. |
| **Web Application** | `app.py` | A Streamlit interface with five pages: an institution-wide Dashboard, an individual student Prediction page, an AI-generated Counseling Plan viewer, a Counselor Notes log, and Model Insights (accuracy, feature importance). |

---

## 📊 Model Performance

Evaluated on a held-out test set of 1,000 students (20% of the data):

| Metric | Value |
|---|---|
| Accuracy | 77.4% |
| F1 Score (dropout class) | 0.432 |
| ROC-AUC | 0.741 |
| Training samples | 4,000 |
| Test samples | 1,000 |

**Top features driving predictions:** current GPA, attendance %, family income, LMS login frequency, mental health score, study hours/week, distance from home, entrance score %, fee payment delay, backlogs.

**Risk tier distribution (full 5,000-student cohort):**

| Tier | Students |
|---|---|
| 🟢 Low | 1,359 |
| 🟡 Medium | 2,518 |
| 🟠 High | 1,072 |
| 🔴 Critical | 51 |

---

## 🔍 Sample Prediction and Counseling Plan

**Student STU101756 (Electrical Engineering)**
**Predicted Risk:** 82.3% → **Critical Risk Tier**

| Risk Factor | Severity | Detail |
|---|---|---|
| Low GPA | High | Current GPA 3.42 vs institutional average 6.75 |
| Pending Backlogs | Medium | 2 backlogs pending |
| Low Attendance | Medium | Attendance at 61.6%, below the 75% threshold |
| Low Online Engagement | Medium | Only 4.9 LMS logins/week |
| Disciplinary History | Medium | 1 disciplinary action on record |

**Generated recommendations (excerpt):**
- **Academic (Urgent):** Schedule academic mentoring/tutoring sessions in weak subjects; consider a personalised study plan.
- **Attendance (Recommended):** Counselor to conduct a one-on-one attendance-barrier interview and set a written attendance recovery plan.
- **Engagement (Recommended):** Send a personalised LMS re-engagement nudge; assign a peer study-buddy.
- **Wellbeing (Recommended):** Assign a behavioral counselor for a supportive, non-punitive follow-up conversation.

---

## 🛠️ Tech Stack

- **Python**, **scikit-learn** (Random Forest, preprocessing pipeline)
- **Streamlit** (web application)
- **SQLite** (persistence layer for predictions & counselor notes)
- **Pandas / NumPy** (data handling)

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/<your-username>/ai-student-dropout-prediction.git
cd ai-student-dropout-prediction

# Install dependencies
pip install -r requirements.txt

# Generate synthetic data (optional — students.csv is included)
python data/generate_data.py

# Train the model
python model/train_model.py

# Launch the web app
streamlit run app.py
```

---

## 📁 Project Structure

```
├── data/
│   ├── generate_data.py
│   └── students.csv
├── model/
│   ├── train_model.py
│   └── dropout_model.pkl
├── utils/
│   ├── counseling.py
│   └── database.py
├── app.py
├── requirements.txt
└── README.md
```

---

## 🔮 Future Work

- Replace the synthetic dataset with real, anonymized institutional data using the same schema.
- Extend the model with more advanced algorithms (e.g., XGBoost).
- Add SHAP-based explanations for deeper model interpretability.

---

## 📄 Conclusion

This project demonstrates a complete pipeline for proactive student support: consolidating multi-dimensional student data, predicting dropout risk with a machine learning model, and translating that prediction into specific, explainable counseling actions rather than an opaque score. The rule-based counseling engine keeps recommendations transparent and auditable — essential for a system that influences real interventions.

---

## 📜 License

This project is open-sourced for educational purposes. Add a license of your choice (e.g., MIT) here.
