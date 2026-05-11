from fastapi import APIRouter

from app.models.schemas import SignupRequest
from app.services.azure_db_service import upsert_user_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
def signup(payload: SignupRequest):
    return upsert_user_profile(payload)
