"""
Speech-to-text proxy for Wispr Flow. Keeps API key server-side.
Used by chat and diagnostic forms for voice input (speak instead of type).
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["transcribe"])


class TranscribeRequest(BaseModel):
    """Base64-encoded 16kHz WAV audio from the client."""
    audio: str
    language: Optional[list[str]] = None  # e.g. ["en"]
    before_text: Optional[str] = None
    after_text: Optional[str] = None


class TranscribeResponse(BaseModel):
    text: str


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(request: TranscribeRequest):
    """
    Transcribe speech to text via Wispr Flow.
    Client sends base64 16kHz WAV; returns transcribed text.
    """
    if not settings.WISPR_API_KEY:
        logger.warning("Transcribe called but WISPR_API_KEY is not set")
        raise HTTPException(
            status_code=503,
            detail="Voice input is not configured. Set WISPR_API_KEY to enable.",
        )
    payload = {
        "audio": request.audio,
        "language": request.language or ["en"],
        "context": {
            "textbox_contents": {
                "before_text": request.before_text or "",
                "selected_text": "",
                "after_text": request.after_text or "",
            },
            "app": {"type": "ai"},
        },
    }
    logger.info("Calling Wispr API at %s (audio length %d chars)", settings.WISPR_API_URL, len(request.audio))
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            settings.WISPR_API_URL,
            json=payload,
            headers={"Authorization": f"Bearer {settings.WISPR_API_KEY}"},
        )
    if resp.status_code != 200:
        detail = resp.text or f"Wispr API error: {resp.status_code}"
        logger.warning("Wispr API error: status=%s body=%s", resp.status_code, (detail[:500] + "..." if len(detail) > 500 else detail))
        raise HTTPException(status_code=502, detail=detail)
    data = resp.json()
    text = data.get("text", "").strip()
    logger.info("Wispr transcription succeeded (%d chars)", len(text))
    return TranscribeResponse(text=text)
