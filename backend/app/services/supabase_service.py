from collections import Counter
from datetime import datetime
from typing import Any, Dict
from urllib.parse import urlencode

import requests

from app.config import get_settings
from app.models.schemas import FacultyCohortResponse, FacultyStudentRow, SignupRequest


def _rest_base() -> str:
    settings = get_settings()
    return f"{settings.supabase_url.rstrip('/')}/rest/v1"


def _headers(prefer: str | None = None) -> Dict[str, str]:
    settings = get_settings()
    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _get(path: str, params: Dict[str, str]) -> list[dict]:
    url = f"{_rest_base()}/{path}?{urlencode(params)}"
    res = requests.get(url, headers=_headers(), timeout=20)
    if not res.ok:
        raise RuntimeError(f"Supabase GET failed: {res.status_code} {res.text}")
    return res.json()


def _upsert(path: str, rows: list[dict], on_conflict: str) -> list[dict]:
    query = urlencode({"on_conflict": on_conflict})
    url = f"{_rest_base()}/{path}?{query}"
    res = requests.post(url, headers=_headers("resolution=merge-duplicates,return=representation"), json=rows, timeout=20)
    if not res.ok:
        raise RuntimeError(f"Supabase UPSERT failed: {res.status_code} {res.text}")
    return res.json()


def _delete(path: str, params: Dict[str, str]) -> list[dict]:
    url = f"{_rest_base()}/{path}?{urlencode(params)}"
    res = requests.delete(url, headers=_headers(), timeout=20)
    if not res.ok:
        raise RuntimeError(f"Supabase DELETE failed: {res.status_code} {res.text}")
    # DELETE operations return empty body on success, so handle gracefully
    if res.text.strip():
        try:
            return res.json()
        except ValueError:
            # If not JSON, return empty list
            return []
    return []


def delete_schedule(user_id: str) -> dict:
    _delete("schedules", {"user_id": f"eq.{user_id}"})
    return {"ok": True}


def delete_syllabus_and_schedule(user_id: str, syllabus_id: str) -> dict:
    syllabus = get_syllabus_by_id(syllabus_id)
    if not syllabus or syllabus.get("user_id") != user_id:
        raise ValueError("Syllabus not found.")

    _delete("topics", {"syllabus_id": f"eq.{syllabus_id}"})
    _delete("syllabi", {"id": f"eq.{syllabus_id}", "user_id": f"eq.{user_id}"})

    remaining_syllabi = list_syllabuses(user_id)
    schedule_deleted = False
    if not remaining_syllabi:
        delete_schedule(user_id)
        schedule_deleted = True

    return {"ok": True, "schedule_deleted": schedule_deleted}


def upsert_user_profile(payload: SignupRequest) -> Dict[str, Any]:
    row = {
        "id": payload.user_id,
        "email": payload.email,
        "role": payload.role,
        "name": payload.name or payload.email.split("@")[0],
        "created_at": datetime.utcnow().isoformat(),
    }
    data = _upsert("users", [row], "id")
    return {"ok": True, "data": data}


def get_faculty_cohort() -> FacultyCohortResponse:
    students = _get("users", {"select": "*", "role": "eq.STUDENT"})
    topics = _get("topics", {"select": "id,name,status,mcq_score,syllabus_id"})
    syllabi = _get("syllabi", {"select": "id,user_id,uploaded_at"})

    syllabus_by_user = {}
    for item in syllabi:
        syllabus_by_user[item["user_id"]] = item

    topics_by_syllabus: dict[str, list[dict]] = {}
    skipped_counter: Counter[str] = Counter()
    for topic in topics:
        sid = topic.get("syllabus_id")
        topics_by_syllabus.setdefault(sid, []).append(topic)
        if topic.get("status") == "pending":
            skipped_counter[topic.get("name", "Unknown")] += 1

    rows: list[FacultyStudentRow] = []
    completion_values: list[float] = []
    for student in students:
        student_syllabus = syllabus_by_user.get(student["id"])
        student_topics = topics_by_syllabus.get(student_syllabus["id"], []) if student_syllabus else []
        total = len(student_topics)
        done = len([t for t in student_topics if t.get("status") == "done"])
        flagged = len([t for t in student_topics if t.get("status") == "flagged"])
        completion = round((done / total) * 100, 2) if total else 0.0
        mcq_scores = [float(t.get("mcq_score") or 0) for t in student_topics]
        mcq_rate = round((sum(mcq_scores) / len(mcq_scores)), 2) if mcq_scores else 0.0
        completion_values.append(completion)
        rows.append(
            FacultyStudentRow(
                id=student["id"],
                email=student["email"],
                name=student.get("name"),
                progress=completion,
                flagged_count=flagged,
                mcq_rate=mcq_rate,
                syllabus_uploaded=bool(student_syllabus),
                last_active=student_syllabus.get("uploaded_at") if student_syllabus else None,
            )
        )

    avg_completion = round(sum(completion_values) / len(completion_values), 2) if completion_values else 0.0
    readiness = round(min(100, avg_completion * 0.7 + 30), 2) if completion_values else 0.0
    most_skipped_topic = skipped_counter.most_common(1)[0][0] if skipped_counter else "No data yet"

    return FacultyCohortResponse(
        total_students=len(rows),
        avg_completion=avg_completion,
        most_skipped_topic=most_skipped_topic,
        cohort_readiness=readiness,
        students=rows,
    )


def insert_syllabus(user_id: str, subject: str, raw_text: str, parsed_json: dict) -> dict:
    row = {
        "user_id": user_id,
        "subject": subject,
        "raw_text": raw_text,
        "parsed_json": parsed_json,
    }
    data = _upsert("syllabi", [row], "id")
    return data[0]


def insert_topics(rows: list[dict]) -> list[dict]:
    if not rows:
        return []
    return _upsert("topics", rows, "id")


def list_syllabuses(user_id: str) -> list[dict]:
    return _get("syllabi", {"select": "id,subject,uploaded_at", "user_id": f"eq.{user_id}"})


def get_syllabus_by_id(syllabus_id: str) -> dict | None:
    results = _get("syllabi", {"select": "id,user_id,subject,raw_text,parsed_json,uploaded_at", "id": f"eq.{syllabus_id}"})
    return results[0] if results else None
