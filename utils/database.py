"""
database.py
-----------
Lightweight SQLite persistence layer.

Two tables:
  - predictions: logs every risk-prediction run (student id, probability,
    risk tier, timestamp).
  - notes: counselor follow-up notes with a status for accountability
    tracking (Open / In Progress / Resolved).
"""

import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import List, Optional, Dict

DB_PATH = "utils/counseling_system.db"

VALID_STATUSES = ("Open", "In Progress", "Resolved")


@contextmanager
def get_connection(db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(db_path: str = DB_PATH) -> None:
    with get_connection(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                risk_probability REAL NOT NULL,
                risk_tier TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                counselor_name TEXT,
                note TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Open',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)


def risk_tier_from_probability(prob: float) -> str:
    if prob >= 0.75:
        return "Critical"
    if prob >= 0.5:
        return "High"
    if prob >= 0.25:
        return "Medium"
    return "Low"


def log_prediction(student_id: str, risk_probability: float, db_path: str = DB_PATH) -> int:
    tier = risk_tier_from_probability(risk_probability)
    with get_connection(db_path) as conn:
        cur = conn.execute(
            "INSERT INTO predictions (student_id, risk_probability, risk_tier, created_at) "
            "VALUES (?, ?, ?, ?)",
            (student_id, risk_probability, tier, datetime.utcnow().isoformat()),
        )
        return cur.lastrowid


def get_predictions(student_id: Optional[str] = None, db_path: str = DB_PATH) -> List[Dict]:
    query = "SELECT * FROM predictions"
    params = ()
    if student_id:
        query += " WHERE student_id = ?"
        params = (student_id,)
    query += " ORDER BY created_at DESC"
    with get_connection(db_path) as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]


def add_note(student_id: str, note: str, counselor_name: str = "", status: str = "Open",
             db_path: str = DB_PATH) -> int:
    if status not in VALID_STATUSES:
        raise ValueError(f"status must be one of {VALID_STATUSES}")
    now = datetime.utcnow().isoformat()
    with get_connection(db_path) as conn:
        cur = conn.execute(
            "INSERT INTO notes (student_id, counselor_name, note, status, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (student_id, counselor_name, note, status, now, now),
        )
        return cur.lastrowid


def update_note_status(note_id: int, status: str, db_path: str = DB_PATH) -> None:
    if status not in VALID_STATUSES:
        raise ValueError(f"status must be one of {VALID_STATUSES}")
    with get_connection(db_path) as conn:
        conn.execute(
            "UPDATE notes SET status = ?, updated_at = ? WHERE id = ?",
            (status, datetime.utcnow().isoformat(), note_id),
        )


def get_notes(student_id: Optional[str] = None, status: Optional[str] = None,
              db_path: str = DB_PATH) -> List[Dict]:
    query = "SELECT * FROM notes WHERE 1=1"
    params = []
    if student_id:
        query += " AND student_id = ?"
        params.append(student_id)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"
    with get_connection(db_path) as conn:
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
