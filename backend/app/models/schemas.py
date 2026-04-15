from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class TopicNode(BaseModel):
    name: str
    subtopics: List[str] = Field(default_factory=list)


class UnitNode(BaseModel):
    unit: str
    topics: List[TopicNode] = Field(default_factory=list)


class ParsedSyllabus(BaseModel):
    subject: str
    units: List[UnitNode] = Field(default_factory=list)


class McqQuestion(BaseModel):
    question: str
    options: List[str]
    answer_index: int
    explanation: str


class McqRequest(BaseModel):
    topic: str


class ReplanRequest(BaseModel):
    exam_date: date
    daily_hours: float = Field(gt=0, le=24)
    days_off: List[str] = Field(default_factory=list)
    topics: List[Dict[str, Any]] = Field(default_factory=list)
    missed_sessions: List[Dict[str, Any]] = Field(default_factory=list)


class ScheduleItem(BaseModel):
    date: str
    topic: str
    estimated_hours: float
    color: str


class ResourceVideo(BaseModel):
    title: str
    channel: str
    duration: str
    thumbnail: str
    url: str


class ResourceArticle(BaseModel):
    title: str
    author: str
    read_time: str
    url: str


class ResourceResponse(BaseModel):
    topic: str
    videos: List[ResourceVideo] = Field(default_factory=list)
    articles: List[ResourceArticle] = Field(default_factory=list)


class SignupRequest(BaseModel):
    user_id: str
    email: str
    role: Literal["STUDENT", "FACULTY"]
    name: Optional[str] = None


class FacultyStudentRow(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    progress: float = 0.0
    flagged_count: int = 0
    mcq_rate: float = 0.0
    syllabus_uploaded: bool = False
    last_active: Optional[datetime] = None


class FacultyCohortResponse(BaseModel):
    total_students: int
    avg_completion: float
    most_skipped_topic: str
    cohort_readiness: float
    students: List[FacultyStudentRow]
