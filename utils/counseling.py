"""
counseling.py
-------------
Transparent, rule-based counseling engine.

Given a student's raw feature values (and optional population norms),
flags specific risk factors and maps each one to a concrete,
prioritized intervention across five categories:
Academic, Attendance, Engagement, Wellbeing, Financial.

This module never uses the ML model directly -- it only reasons over
raw feature values, which keeps recommendations auditable and
explainable to non-technical staff.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional

# ---- Population-norm thresholds (defaults; override with real institutional norms) ----
DEFAULT_NORMS = {
    "gpa_average": 6.75,
    "gpa_low_threshold": 5.0,
    "attendance_threshold": 75.0,
    "backlogs_concern": 1,
    "lms_login_low_threshold": 6.0,
    "mental_health_low_threshold": 5.0,
    "fee_delay_concern_days": 30,
    "sleep_low_threshold": 5.5,
    "disciplinary_concern": 1,
}

RISK_TO_CATEGORY = {
    "Low GPA": "Academic",
    "Pending Backlogs": "Academic",
    "Low Attendance": "Attendance",
    "Low Online Engagement": "Engagement",
    "Low Library Engagement": "Engagement",
    "Wellbeing Concern": "Wellbeing",
    "Sleep Deprivation": "Wellbeing",
    "Disciplinary History": "Wellbeing",
    "Fee Payment Delay": "Financial",
}

RECOMMENDATIONS = {
    "Low GPA": ("Urgent", "Schedule academic mentoring / tutoring sessions in weak subjects; "
                          "consider a personalised study plan."),
    "Pending Backlogs": ("Urgent", "Arrange backlog-clearance coaching and remedial classes before "
                                   "the next exam cycle."),
    "Low Attendance": ("Recommended", "Counselor to conduct a one-on-one attendance-barrier interview "
                                      "and set a written attendance recovery plan."),
    "Low Online Engagement": ("Recommended", "Send a personalised LMS re-engagement nudge; assign a "
                                              "peer study-buddy."),
    "Low Library Engagement": ("Optional", "Encourage use of library resources and study spaces; "
                                           "share curated reading/reference material."),
    "Wellbeing Concern": ("Urgent", "Assign a behavioral counselor for a supportive, non-punitive "
                                     "follow-up conversation."),
    "Sleep Deprivation": ("Recommended", "Share wellness resources on sleep hygiene; check for "
                                         "underlying workload or stress causes."),
    "Disciplinary History": ("Recommended", "Pair with a faculty mentor for behavioral check-ins; "
                                             "review case history with the counseling cell."),
    "Fee Payment Delay": ("Recommended", "Connect the student with the financial aid office to "
                                         "discuss scholarships, installment plans, or emergency funds."),
}

SEVERITY_ORDER = {"High": 0, "Medium": 1, "Low": 2}
PRIORITY_ORDER = {"Urgent": 0, "Recommended": 1, "Optional": 2}


@dataclass
class RiskFactor:
    name: str
    severity: str
    detail: str
    category: str


@dataclass
class Recommendation:
    category: str
    priority: str
    action: str


@dataclass
class CounselingPlan:
    risk_factors: List[RiskFactor] = field(default_factory=list)
    recommendations: List[Recommendation] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "risk_factors": [rf.__dict__ for rf in self.risk_factors],
            "recommendations": [r.__dict__ for r in self.recommendations],
        }


def _severity(value: float, low: float, high: float, higher_is_worse: bool = False) -> Optional[str]:
    """Simple helper to bucket a value's severity relative to thresholds."""
    if higher_is_worse:
        if value >= high:
            return "High"
        if value >= low:
            return "Medium"
        return None
    else:
        if value <= low:
            return "High"
        if value <= high:
            return "Medium"
        return None


def identify_risk_factors(student: Dict, norms: Optional[Dict] = None) -> List[RiskFactor]:
    """
    Inspect a student's raw feature values against population norms/thresholds
    and return a list of flagged RiskFactor objects.

    `student` should contain (at minimum) the keys used below -- e.g. as
    produced by pandas' `.to_dict()` on a single row.
    """
    norms = {**DEFAULT_NORMS, **(norms or {})}
    risks: List[RiskFactor] = []

    gpa = student.get("current_gpa")
    if gpa is not None and gpa <= norms["gpa_low_threshold"] + 2.0:
        sev = "High" if gpa <= norms["gpa_low_threshold"] else "Medium"
        risks.append(RiskFactor(
            "Low GPA", sev,
            f"Current GPA {gpa:.2f} vs institutional average {norms['gpa_average']:.2f}",
            RISK_TO_CATEGORY["Low GPA"],
        ))

    backlogs = student.get("backlogs")
    if backlogs is not None and backlogs >= norms["backlogs_concern"]:
        sev = "High" if backlogs >= 3 else "Medium"
        risks.append(RiskFactor(
            "Pending Backlogs", sev, f"{int(backlogs)} backlogs pending",
            RISK_TO_CATEGORY["Pending Backlogs"],
        ))

    attendance = student.get("attendance_pct")
    if attendance is not None and attendance < norms["attendance_threshold"]:
        sev = "High" if attendance < 50 else "Medium"
        risks.append(RiskFactor(
            "Low Attendance", sev,
            f"Attendance at {attendance:.1f}%, below the {norms['attendance_threshold']:.0f}% threshold",
            RISK_TO_CATEGORY["Low Attendance"],
        ))

    lms = student.get("lms_login_frequency_per_week")
    if lms is not None and lms < norms["lms_login_low_threshold"]:
        risks.append(RiskFactor(
            "Low Online Engagement", "Medium", f"Only {lms:.1f} LMS logins/week",
            RISK_TO_CATEGORY["Low Online Engagement"],
        ))

    library = student.get("library_visits_per_month")
    if library is not None and library < 2:
        risks.append(RiskFactor(
            "Low Library Engagement", "Low", f"Only {int(library)} library visits/month",
            RISK_TO_CATEGORY["Low Library Engagement"],
        ))

    mental_health = student.get("mental_health_score")
    if mental_health is not None and mental_health < norms["mental_health_low_threshold"]:
        sev = "High" if mental_health < 3 else "Medium"
        risks.append(RiskFactor(
            "Wellbeing Concern", sev, f"Self-reported wellbeing score {mental_health:.1f}/10",
            RISK_TO_CATEGORY["Wellbeing Concern"],
        ))

    sleep = student.get("sleep_hours_per_night")
    if sleep is not None and sleep < norms["sleep_low_threshold"]:
        risks.append(RiskFactor(
            "Sleep Deprivation", "Low", f"Averaging {sleep:.1f} hours of sleep/night",
            RISK_TO_CATEGORY["Sleep Deprivation"],
        ))

    disciplinary = student.get("disciplinary_actions")
    if disciplinary is not None and disciplinary >= norms["disciplinary_concern"]:
        risks.append(RiskFactor(
            "Disciplinary History", "Medium", f"{int(disciplinary)} disciplinary action(s) on record",
            RISK_TO_CATEGORY["Disciplinary History"],
        ))

    fee_delay = student.get("fee_payment_delay_days")
    if fee_delay is not None and fee_delay >= norms["fee_delay_concern_days"]:
        sev = "High" if fee_delay >= 60 else "Medium"
        risks.append(RiskFactor(
            "Fee Payment Delay", sev, f"Fee payment delayed by {int(fee_delay)} days",
            RISK_TO_CATEGORY["Fee Payment Delay"],
        ))

    risks.sort(key=lambda r: SEVERITY_ORDER.get(r.severity, 3))
    return risks


def generate_counseling_plan(student: Dict, norms: Optional[Dict] = None) -> CounselingPlan:
    """Full pipeline: identify risk factors, then map each to a prioritized recommendation."""
    risk_factors = identify_risk_factors(student, norms)

    recs: List[Recommendation] = []
    for rf in risk_factors:
        priority, action = RECOMMENDATIONS.get(rf.name, ("Optional", "Monitor and follow up as needed."))
        recs.append(Recommendation(category=rf.category, priority=priority, action=action))

    # De-duplicate categories, keep highest-priority action per category, sort by urgency
    seen_categories = {}
    for r in recs:
        if r.category not in seen_categories or PRIORITY_ORDER[r.priority] < PRIORITY_ORDER[seen_categories[r.category].priority]:
            seen_categories[r.category] = r
    unique_recs = sorted(seen_categories.values(), key=lambda r: PRIORITY_ORDER.get(r.priority, 3))

    return CounselingPlan(risk_factors=risk_factors, recommendations=unique_recs)
