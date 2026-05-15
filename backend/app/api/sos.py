"""
RoadSoS SOS API — AI triage + multi-channel alert dispatch
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import httpx, os, json
from app.core.config import settings

router = APIRouter()

# ── MODELS ──────────────────────────────────────────────
class Contact(BaseModel):
    name: str
    phone: str

class Location(BaseModel):
    lat: float
    lon: float
    address: Optional[str] = None
    accuracy: Optional[float] = None

class Hospital(BaseModel):
    name: str
    phone: Optional[str] = None
    approx_dist_m: Optional[float] = None

class TriageResult(BaseModel):
    severity: str  # CRITICAL / MODERATE / MINOR
    intent: str
    confidence: Optional[float] = None

class SOSRequest(BaseModel):
    contacts: List[Contact]
    message: str
    location: Location
    hospital: Optional[Hospital] = None
    triage: Optional[TriageResult] = None
    timestamp: str

class TriageRequest(BaseModel):
    user_input: str
    lat: Optional[float] = None
    lon: Optional[float] = None

# ── TRIAGE ENDPOINT ─────────────────────────────────────
@router.post("/triage")
async def triage_emergency(req: TriageRequest):
    """
    AI-powered emergency severity classification.
    Uses Claude/Gemini when available; keyword fallback otherwise.
    """
    result = await classify_with_llm(req.user_input)
    return result

async def classify_with_llm(text: str) -> dict:
    """Try Claude → Gemini → keyword fallback."""

    # 1. Try Claude API
    if settings.anthropic_api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            prompt = f"""You are an emergency triage assistant for road accidents.

User message: "{text}"

Classify this emergency and respond ONLY with valid JSON (no markdown):
{{
  "severity": "CRITICAL" | "MODERATE" | "MINOR",
  "intent": "accident" | "breakdown" | "medical" | "harassment" | "general",
  "confidence": 0.0-1.0,
  "first_aid": ["step1", "step2", "step3"],
  "priority_service": "hospital" | "ambulance" | "police" | "towing",
  "reasoning": "brief explanation"
}}"""
            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}]
            )
            raw = message.content[0].text.strip()
            return json.loads(raw)
        except Exception as e:
            print(f"Claude triage failed: {e}")

    # 2. Try Gemini API
    if settings.gemini_api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f'Classify this road emergency as JSON: "{text}". Return: {{"severity":"CRITICAL/MODERATE/MINOR","intent":"accident/breakdown/medical","first_aid":["step1","step2"],"priority_service":"hospital/ambulance/police"}}'
            resp = model.generate_content(prompt)
            raw = resp.text.strip().replace("```json","").replace("```","")
            return json.loads(raw)
        except Exception as e:
            print(f"Gemini triage failed: {e}")

    # 3. Keyword fallback (always works offline)
    return keyword_classify(text)

def keyword_classify(text: str) -> dict:
    lower = text.lower()
    severity = "MODERATE"
    if any(k in lower for k in ["unconscious","not breathing","bleeding heavily","critical","dying","collapsed","multiple victims"]):
        severity = "CRITICAL"
    elif any(k in lower for k in ["minor","scratch","conscious","stable","awake","ok"]):
        severity = "MINOR"

    intent = "accident"
    if any(k in lower for k in ["tyre","puncture","breakdown","stalled","towing"]): intent = "breakdown"
    elif any(k in lower for k in ["seizure","heart","stroke","diabetic"]): intent = "medical"
    elif any(k in lower for k in ["harassment","fight","attack","robbery"]): intent = "harassment"

    first_aid_map = {
        "CRITICAL": ["Apply firm pressure to wounds","Check breathing — start CPR if absent","Do NOT move the victim unless in danger"],
        "MODERATE": ["Keep person still and calm","Do not give food or water","Monitor breathing every 2 min"],
        "MINOR":    ["Move person away from traffic","Collect witness details","Call police if needed"],
    }
    priority_map = {
        "accident":"ambulance", "breakdown":"towing",
        "medical":"ambulance",  "harassment":"police"
    }
    return {
        "severity": severity, "intent": intent,
        "confidence": 0.75, "method": "keyword",
        "first_aid": first_aid_map[severity],
        "priority_service": priority_map.get(intent, "hospital"),
        "reasoning": "Keyword-based classification (offline)"
    }

# ── SOS SEND ENDPOINT ───────────────────────────────────
@router.post("/send")
async def send_sos(req: SOSRequest, background_tasks: BackgroundTasks):
    """
    Dispatch SOS alerts via SMS (Twilio) + Telegram Bot.
    Runs alert sending in background to return fast response.
    """
    if not req.contacts:
        raise HTTPException(status_code=400, detail="No emergency contacts provided")

    results = []
    background_tasks.add_task(dispatch_alerts, req, results)

    return {
        "status": "dispatching",
        "contacts": len(req.contacts),
        "message": "SOS alerts are being sent",
        "timestamp": req.timestamp
    }

async def dispatch_alerts(req: SOSRequest, results: list):
    """Background task: send SMS + Telegram alerts."""
    for contact in req.contacts:
        # SMS via Twilio
        if settings.twilio_account_sid and settings.twilio_auth_token:
            try:
                from twilio.rest import Client
                client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
                msg = client.messages.create(
                    body=req.message,
                    from_=settings.twilio_from_number,
                    to=contact.phone
                )
                results.append({"contact": contact.name, "channel": "sms", "status": "sent", "sid": msg.sid})
            except Exception as e:
                results.append({"contact": contact.name, "channel": "sms", "status": "failed", "error": str(e)})

        # Telegram Bot (if configured)
        if settings.telegram_bot_token and hasattr(contact, "telegram_id"):
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                        json={"chat_id": contact.telegram_id, "text": req.message, "parse_mode": "Markdown"}
                    )
                results.append({"contact": contact.name, "channel": "telegram", "status": "sent"})
            except Exception as e:
                results.append({"contact": contact.name, "channel": "telegram", "status": "failed", "error": str(e)})

    print(f"SOS dispatch complete: {results}")
