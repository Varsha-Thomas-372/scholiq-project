import json
import os
import sys

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import McqRequest, ReplanRequest
from app.services.anthropic_service import (
    generate_mcq_with_claude,
    parse_syllabus_with_claude,
    replan_schedule_with_claude,
)
from app.services.pdf_service import extract_pdf_text
from app.services.resource_service import fetch_topic_resources
from app.services.supabase_service import delete_schedule, delete_syllabus_and_schedule, list_syllabuses

# Import the new robust parser from backend service location
try:
    from app.services.syllabus_parser import parse_syllabus as robust_parse_syllabus
except ImportError as e:
    print(f"Failed to load robust syllabus parser: {e}")
    robust_parse_syllabus = None

router = APIRouter(tags=["ai"])


@router.post("/parse-syllabus")
async def parse_syllabus(file: UploadFile = File(...)):
    if file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        content = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read the uploaded file. Please provide a valid PDF.")

    if not content:
        raise HTTPException(status_code=400, detail="Empty file. Please upload a syllabus PDF with content.")

    try:
        raw_text = extract_pdf_text(content)
    except Exception:
        raise HTTPException(status_code=400, detail="The uploaded PDF could not be parsed. Please upload a valid syllabus PDF.")

    if not raw_text:
        raise HTTPException(status_code=400, detail="No readable text found in the PDF. Please check the document and try again.")

    # Try the new robust parser first, fallback to Claude if not available
    if robust_parse_syllabus:
        try:
            parsed = robust_parse_syllabus(raw_text)
            # Convert to the expected format for frontend compatibility
            units = []
            for unit in parsed.get("units", []):
                units.append({
                    "unit": f"Unit {unit['unit_number']}: {unit['unit_name']}",
                    "topics": unit["topics"]  # Now topics are already dicts with name and subtopics
                })
            return {"subject": parsed.get("course_name", "Parsed Syllabus"), "units": units, "raw_text": raw_text}
        except Exception as e:
            print(f"Robust parser failed, falling back to Claude: {e}")
    
    # Fallback to existing Claude parser
    parsed = parse_syllabus_with_claude(raw_text)
    return {"subject": parsed.subject, "units": [json.loads(unit.model_dump_json()) for unit in parsed.units], "raw_text": raw_text}


@router.post("/generate-mcq")
def generate_mcq(payload: McqRequest):
    questions = generate_mcq_with_claude(payload.topic)
    return {"topic": payload.topic, "questions": [json.loads(q.model_dump_json()) for q in questions]}


@router.post("/replan-schedule")
def replan_schedule(payload: ReplanRequest):
    sessions = replan_schedule_with_claude(
        exam_date=payload.exam_date,
        daily_hours=payload.daily_hours,
        days_off=payload.days_off,
        topics=payload.topics,
        missed_sessions=payload.missed_sessions,
    )
    return {"plan": [json.loads(item.model_dump_json()) for item in sessions]}


@router.delete("/schedule")
def remove_schedule(user_id: str):
    try:
        return delete_schedule(user_id=user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.delete("/syllabi/{syllabus_id}")
def delete_syllabus(syllabus_id: str, user_id: str):
    try:
        result = delete_syllabus_and_schedule(user_id=user_id, syllabus_id=syllabus_id)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/syllabi")
def list_user_syllabuses(user_id: str):
    """
    List user's syllabi for multi-upload switching (Core Fix 2).
    """
    syllabi = list_syllabuses(user_id)
    return {"syllabi": syllabi}


@router.get("/resources/{topic}")
def resources(topic: str):
    response = fetch_topic_resources(topic)
    return response.model_dump()
