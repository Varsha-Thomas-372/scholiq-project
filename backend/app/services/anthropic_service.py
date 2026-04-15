import json
import re
from datetime import date, timedelta
from typing import Any, Dict, List



from app.config import get_settings
from app.models.schemas import McqQuestion, ParsedSyllabus, ScheduleItem, TopicNode, UnitNode


def _extract_json(raw: str) -> Dict[str, Any]:
    cleaned = raw.strip()
    cleaned = re.sub(r"^```json", "", cleaned)
    cleaned = re.sub(r"```$", "", cleaned).strip()
    return json.loads(cleaned)


def _normalize_text(value: str) -> str:
    cleaned = re.sub(r"[\s\n]+", " ", value).strip(" \t\n-.,;:")
    cleaned = re.sub(r"\s+([,.:;])", r"\1", cleaned)
    if not cleaned:
        return ""
    return " ".join(word.capitalize() for word in cleaned.split())


def _remove_junk(line: str) -> bool:
    junk_patterns = [r"course code", r"contact hours", r"outcomes?", r"learning outcomes", r"credit[s]?", r"total hours"]
    return any(re.search(pattern, line, re.IGNORECASE) for pattern in junk_patterns)


def _detect_document_type(text: str) -> str:
    if re.search(r"Section\s*1:|Section\s*2:", text, re.IGNORECASE):
        return "section_based"
    if re.search(r"UNIT\s*I\b|UNIT\s*II\b|UNIT[-\s]*III\b", text, re.IGNORECASE):
        return "unit_based"
    return "generic"


def _split_subtopics(text: str) -> list[str]:
    """Split subtopic text by commas, periods, and semicolons."""
    items = [item.strip() for item in re.split(r"[,;.\n]", text) if item.strip()]
    return [_normalize_text(item) for item in items if item and not _remove_junk(item)]


def _group_topic_lines(lines: list[str]) -> list[str]:
    """Group lines where continuation (no ':') belongs to previous topic line."""
    if not lines:
        return []
    grouped: list[str] = []
    current_group = ""
    for line in lines:
        if ":" in line or not current_group:
            if current_group and current_group.strip():
                grouped.append(current_group.strip())
            current_group = line
        else:
            current_group += " " + line
    if current_group.strip():
        grouped.append(current_group.strip())
    return grouped


def _extract_topic_and_subtopics(line: str) -> tuple[str, list[str]]:
    """Extract topic name and subtopics from a line using ':' as delimiter."""
    if ":" not in line:
        topic_name = _normalize_text(line)
        return (topic_name, [])
    parts = [part.strip() for part in line.split(":", 1) if part.strip()]
    topic_name = _normalize_text(parts[0])
    subtopics = _split_subtopics(parts[1]) if len(parts) > 1 else []
    return (topic_name, subtopics)


def _parse_section_based(text: str) -> dict:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    sections: list[dict] = []
    current = None
    for line in lines:
        if _remove_junk(line):
            continue
        section_match = re.match(r"^(Section\s*\d+[:\.]?\s*)(.*)$", line, re.IGNORECASE)
        if section_match:
            title = _normalize_text(section_match.group(0))
            current = {"title": title, "topics": []}
            sections.append(current)
            continue
        if current:
            topic_name, subtopics = _extract_topic_and_subtopics(line)
            if topic_name:
                current["topics"].append({"name": topic_name, "subtopics": subtopics})
    if not sections:
        return {"type": "section_based", "sections": [{"title": "Section 1", "topics": [{"name": "Core Concepts", "subtopics": []}]}]}
    return {"type": "section_based", "sections": sections}


def _parse_unit_based(text: str) -> dict:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    units: list[dict] = []
    current = None
    for line in lines:
        if _remove_junk(line):
            continue
        unit_match = re.match(r"^(UNIT[-\s]*[IVXLCDM]+[:\.]?\s*)(.*)$", line, re.IGNORECASE)
        if unit_match:
            title = _normalize_text(unit_match.group(0))
            current = {"title": title, "topics": []}
            units.append(current)
            continue
        if current:
            topic_name, subtopics = _extract_topic_and_subtopics(line)
            if topic_name:
                current["topics"].append({"name": topic_name, "subtopics": subtopics})
    if not units:
        return {"type": "unit_based", "units": [{"title": "Unit 1", "topics": [{"name": "Core Concepts", "subtopics": []}]}]}
    return {"type": "unit_based", "units": units}


def _fallback_syllabus(text: str) -> ParsedSyllabus:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip() and not _remove_junk(ln)]
    subject = "Uploaded Syllabus"
    for line in lines[:10]:
        if len(line) > 3 and not re.match(r"^(Section|Module|Chapter|Unit|Part)", line, re.IGNORECASE):
            subject = _normalize_text(line)
            break
    topics = []
    for line in lines:
        if re.match(r"^(Section|Module|Chapter|Unit|Part)", line, re.IGNORECASE):
            continue
        if ':' in line:
            line = line.split(':', 1)[1]
        parts = [part.strip() for part in re.split(r"[.;]\s*", line) if part.strip()]
        for part in parts:
            part_text = _normalize_text(part)
            if part_text and len(part_text.split()) <= 20:
                topics.append(TopicNode(name=part_text, subtopics=[]))
    if not topics:
        topics = [TopicNode(name="Core Concepts", subtopics=[])]
    return ParsedSyllabus(subject=subject, units=[UnitNode(unit="Topics", topics=topics)])


def _parse_generic_with_claude(text: str) -> dict:
    settings = get_settings()
    if not settings.anthropic_api_key:
        fallback = _fallback_syllabus(text)
        return {
            "type": "generic",
            "subject": fallback.subject,
            "units": [{"title": unit.unit, "topics": [{"name": topic.name, "subtopics": topic.subtopics} for topic in unit.topics]} for unit in fallback.units],
        }
    # Azure OpenAI equivalent: Replace Anthropic client w/ openai.AzureOpenAI(endpoint=..., api_key=...), same prompt/JSON extraction logic.
    client = Anthropic(api_key=settings.anthropic_api_key)
    prompt = (
        "Structure the syllabus into JSON with type 'generic'. Return exactly: {\n"
        "  \"type\": \"generic\",\n"
        "  \"subject\": \"...\",\n"
        "  \"units\": [{\n"
        "    \"title\": \"...\",\n"
        "    \"topics\": [{\n"
        "      \"name\": \"...\",\n"
        "      \"subtopics\": [\"...\"]\n"
        "    }]\n"
        "  }]\n"
        "}\n"
        "Extract topics and subtopics. Do not summarize. Remove contact hours and outcomes lines."
    )
    try:
        response = client.messages.create(
            model="claude-3-7-sonnet-latest",
            max_tokens=4500,
            temperature=0,
            messages=[{"role": "user", "content": f"{prompt}\n\nSYLLABUS TEXT:\n{text[:120000]}"}],
        )
        raw = response.content[0].text if response.content else "{}"
        data = _extract_json(raw)
        if data.get("type") != "generic":
            data["type"] = "generic"
        return data
    except Exception:
        fallback = _fallback_syllabus(text)
        return {
            "type": "generic",
            "subject": fallback.subject,
            "units": [{"title": unit.unit, "topics": [{"name": topic.name, "subtopics": topic.subtopics} for topic in unit.topics]} for unit in fallback.units],
        }


def _build_parsed_payload(raw_text: str) -> dict:
    doc_type = _detect_document_type(raw_text)
    if doc_type == "section_based":
        parsed = _parse_section_based(raw_text)
    elif doc_type == "unit_based":
        parsed = _parse_unit_based(raw_text)
    else:
        parsed = _parse_generic_with_claude(raw_text)

    parsed["subject"] = parsed.get("subject", "Uploaded Syllabus")
    if parsed["type"] == "section_based":
        parsed["units"] = [
            {"unit": section["title"], "topics": section["topics"]}
            for section in parsed.get("sections", [])
        ]
    elif parsed["type"] == "unit_based":
        parsed["units"] = [
            {"unit": unit["title"], "topics": unit["topics"]}
            for unit in parsed.get("units", [])
        ]
    else:
        parsed["units"] = [
            {"unit": unit.get("title", f"Unit {idx+1}"), "topics": unit.get("topics", [])}
            for idx, unit in enumerate(parsed.get("units", []))
        ]
    return parsed


def parse_syllabus_with_claude(text: str) -> ParsedSyllabus:
    parsed_payload = _build_parsed_payload(text)
    return ParsedSyllabus(subject=parsed_payload["subject"], units=[UnitNode(unit=u["unit"], topics=[TopicNode(name=t["name"], subtopics=t.get("subtopics", [])) for t in u.get("topics", [])]) for u in parsed_payload.get("units", [])])


def generate_mcq_with_claude(topic: str) -> List[McqQuestion]:
    settings = get_settings()
    if settings.anthropic_api_key:
        client = Anthropic(api_key=settings.anthropic_api_key)
        prompt = (
            "Generate exactly 3 multiple-choice questions for the topic. Return JSON array where each item is "
            '{"question":"","options":["a","b","c","d"],"answer_index":0,"explanation":""}.'
        )
        try:
            response = client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=1200,
                temperature=0.4,
                messages=[{"role": "user", "content": f"{prompt}\nTopic: {topic}"}],
            )
            raw = response.content[0].text if response.content else "[]"
            data = _extract_json(raw)
            if isinstance(data, list):
                return [McqQuestion(**item) for item in data[:3]]
        except Exception:
            pass
    return [
        McqQuestion(
            question=f"Which statement best describes a key concept in {topic}?",
            options=[
                f"A foundational principle of {topic}",
                f"An unrelated historical fact",
                "A random workflow step",
                "A peripheral definition only",
            ],
            answer_index=0,
            explanation=f"{topic} is best understood through its core principles.",
        ),
        McqQuestion(
            question=f"What is a practical use of {topic}?",
            options=[
                "Applying concepts to solve domain problems",
                "Ignoring all validation",
                "Memorizing without context",
                "Skipping fundamentals",
            ],
            answer_index=0,
            explanation="Application-based learning improves retention and performance.",
        ),
        McqQuestion(
            question=f"How should you prepare {topic} for exams?",
            options=[
                "Break it into subtopics and revise actively",
                "Study only one day before",
                "Avoid practice questions",
                "Skip difficult areas",
            ],
            answer_index=0,
            explanation="Structured revision with practice increases confidence and recall.",
        ),
    ]


def replan_schedule_with_claude(
    exam_date: date, daily_hours: float, days_off: List[str], topics: List[Dict[str, Any]], missed_sessions: List[Dict[str, Any]]
) -> List[ScheduleItem]:
    settings = get_settings()
    if settings.anthropic_api_key:
        client = Anthropic(api_key=settings.anthropic_api_key)
        prompt = (
            "Create a day-by-day study schedule JSON array. Each item: "
            '{"date":"YYYY-MM-DD","topic":"","estimated_hours":1.5,"color":"#hex"}. '
            "Prioritize pending and missed sessions first."
        )
        try:
            response = client.messages.create(
                model="claude-3-7-sonnet-latest",
                max_tokens=2200,
                temperature=0.2,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"{prompt}\nExam date: {exam_date}\nDaily hours: {daily_hours}\nDays off: {days_off}\n"
                            f"Topics: {json.dumps(topics)}\nMissed: {json.dumps(missed_sessions)}"
                        ),
                    }
                ],
            )
            raw = response.content[0].text if response.content else "[]"
            data = _extract_json(raw)
            if isinstance(data, list):
                return [ScheduleItem(**item) for item in data]
        except Exception:
            pass

    days = (exam_date - date.today()).days
    horizon = max(1, min(days, 60))
    queue = [topic.get("name", "Revision") for topic in topics if topic.get("status") != "done"] or ["Revision"]
    queue.extend([miss.get("topic", "Missed Session Recovery") for miss in missed_sessions])
    plan: list[ScheduleItem] = []
    topic_index = 0
    for offset in range(horizon):
        day = date.today() + timedelta(days=offset)
        weekday = day.strftime("%A").lower()
        if weekday in [d.lower() for d in days_off]:
            continue
        topic = queue[topic_index % len(queue)]
        topic_index += 1
        plan.append(
            ScheduleItem(
                date=day.isoformat(),
                topic=topic,
                estimated_hours=float(min(4, max(1, daily_hours))),
                color="#6C63FF",
            )
        )
    return plan
