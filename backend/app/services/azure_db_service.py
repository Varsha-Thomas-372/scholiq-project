from collections import Counter
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool
from app.config import get_settings
from app.models.schemas import FacultyCohortResponse, FacultyStudentRow, SignupRequest

settings = get_settings()
engine = create_engine(settings.azure_sql_connstr, poolclass=QueuePool, pool_pre_ping=True, echo=False)


def get_connection():
    with engine.connect() as conn:
        yield conn


def _execute_get(sql: str, params: Dict = None) -> List[Dict]:
    with engine.connect() as conn:
        result = conn.execute(text(sql), params or {})
        return [dict(row._mapping) for row in result]


def _execute_upsert(sql: str, params: Dict) -> Dict:
    with engine.connect() as conn:
        result = conn.execute(text(sql), params)
        conn.commit()
        return dict(result.fetchone() or {})


def upsert_user_profile(payload: SignupRequest) -> Dict[str, Any]:
    created_at = datetime.utcnow()
    sql = """
    MERGE users AS target
    USING (VALUES (:id, :email, :role, :name, :created_at)) AS source (id, email, role, name, created_at)
    ON target.id = source.id
    WHEN MATCHED THEN 
        UPDATE SET email = source.email, role = source.role, name = source.name, created_at = source.created_at
    WHEN NOT MATCHED THEN 
        INSERT (id, email, role, name, created_at) 
        VALUES (source.id, source.email, source.role, source.name, source.created_at);
    """
    _execute_upsert(sql, {
        "id": payload.user_id,
        "email": payload.email,
        "role": payload.role,
        "name": payload.name or payload.email.split("@")[0],
        "created_at": created_at
    })
    return {"ok": True, "data": {"id": payload.user_id, "created_at": created_at.isoformat()}}


def get_faculty_cohort() -> FacultyCohortResponse:
    students = _execute_get("SELECT id, email, [name] FROM users WHERE role = 'STUDENT'")
    syllabi = _execute_get("SELECT id, user_id, uploaded_at FROM syllabi")
    topics = _execute_get("SELECT id, name, status, mcq_score, syllabus_id FROM topics")

    syllabus_by_user = {item["user_id"]: item for item in syllabi}

    topics_by_syllabus: Dict[str, List[Dict]] = {}
    skipped_counter: Counter[str] = Counter()
    for topic in topics:
        sid = topic["syllabus_id"]
        topics_by_syllabus.setdefault(sid, []).append(topic)
        if topic["status"] == "pending":
            skipped_counter[topic["name"] or "Unknown"] += 1

    rows: List[FacultyStudentRow] = []
    completion_values = []
    for student in students:
        student_syllabus = syllabus_by_user.get(student["id"], {})
        student_topics = topics_by_syllabus.get(student_syllabus["id"], [])
        total = len(student_topics)
        done = len([t for t in student_topics if t["status"] == "done"])
        flagged = len([t for t in student_topics if t["status"] == "flagged"])
        completion = round((done / total) * 100, 2) if total else 0.0
        mcq_scores = [float(t["mcq_score"] or 0) for t in student_topics]
        mcq_rate = round(sum(mcq_scores) / len(mcq_scores), 2) if mcq_scores else 0.0
        completion_values.append(completion)
        rows.append(FacultyStudentRow(
            id=str(student["id"]),
            email=student["email"],
            name=student.get("name"),
            progress=completion,
            flagged_count=flagged,
            mcq_rate=mcq_rate,
            syllabus_uploaded=bool(student_syllabus),
            last_active=student_syllabus.get("uploaded_at"),
        ))

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


def insert_syllabus(user_id: str, subject: str, raw_text: str, parsed_json: Dict) -> Dict:
    sql = """
    INSERT INTO syllabi (user_id, subject, raw_text, parsed_json, uploaded_at)
    OUTPUT INSERTED.*
    VALUES (:user_id, :subject, :raw_text, CAST(:parsed_json AS NVARCHAR(MAX)), GETUTCDATE())
    """
    params = {
        "user_id": user_id,
        "subject": subject,
        "raw_text": raw_text,
        "parsed_json": json.dumps(parsed_json)
    }
    result = _execute_upsert(sql, params)
    return result


def insert_topics(rows: List[Dict]) -> List[Dict]:
    if not rows:
        return []
    # Batch insert stub - implement bulk for prod
    inserted = []
    for row in rows:
        sql = """
        INSERT INTO topics (syllabus_id, unit, name, status, time_spent, mcq_score)
        OUTPUT INSERTED.*
        VALUES (:syllabus_id, :unit, :name, :status, 0, 0)
        """
        inserted.append(_execute_upsert(sql, row))
    return inserted


def list_syllabuses(user_id: str) -> List[Dict]:
    return _execute_get("SELECT id, subject, uploaded_at FROM syllabi WHERE user_id = :user_id", {"user_id": user_id})


def get_syllabus_by_id(syllabus_id: str) -> Optional[Dict]:
    results = _execute_get("SELECT * FROM syllabi WHERE id = :id", {"id": syllabus_id})
    return results[0] if results else None


def delete_schedule(user_id: str) -> Dict:
    _execute_upsert("DELETE FROM schedules WHERE user_id = :user_id", {"user_id": user_id})
    return {"ok": True}


def delete_syllabus_and_schedule(user_id: str, syllabus_id: str) -> Dict:
    syllabus = get_syllabus_by_id(syllabus_id)
    if not syllabus or syllabus["user_id"] != user_id:
        raise ValueError("Syllabus not found.")

    _execute_upsert("DELETE FROM topics WHERE syllabus_id = :id", {"id": syllabus_id})
    _execute_upsert("DELETE FROM syllabi WHERE id = :id AND user_id = :user_id", {"id": syllabus_id, "user_id": user_id})

    remaining = list_syllabuses(user_id)
    schedule_deleted = not remaining
    if schedule_deleted:
        delete_schedule(user_id)

    return {"ok": True, "schedule_deleted": schedule_deleted}

