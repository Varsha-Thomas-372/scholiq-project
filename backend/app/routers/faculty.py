from fastapi import APIRouter

from app.services.supabase_service import get_faculty_cohort

router = APIRouter(prefix="/faculty", tags=["faculty"])


@router.get("/cohort")
def faculty_cohort():
    return get_faculty_cohort().model_dump()
