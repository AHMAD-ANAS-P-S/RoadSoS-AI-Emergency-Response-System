"""Auth API — minimal JWT-based auth for RoadSoS (anonymous sessions)."""
from fastapi import APIRouter
from pydantic import BaseModel
import uuid, time
from jose import jwt
from app.core.config import settings

router = APIRouter()

class SessionResponse(BaseModel):
    session_id: str
    token: str

@router.post("/session", response_model=SessionResponse)
async def create_anonymous_session():
    """Create an anonymous session. No PII collected."""
    session_id = str(uuid.uuid4())
    token = jwt.encode(
        {"sub": session_id, "iat": int(time.time()), "exp": int(time.time()) + 86400 * 7},
        settings.secret_key, algorithm="HS256"
    )
    return {"session_id": session_id, "token": token}
