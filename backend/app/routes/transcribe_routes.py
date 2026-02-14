"""
Speech-to-text proxy. Keeps API keys server-side.
Primary: OpenAI Whisper (STT_PROVIDER=openai). Optional: Wispr Flow (STT_PROVIDER=wispr).
Used by chat and diagnostic forms for voice input (speak instead of type).
"""
import base64
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["transcribe"])

# Feature flag: "openai" (default) or "wispr". Use getattr so config works before STT_* are added.
STT_PROVIDER = getattr(settings, "STT_PROVIDER", "openai")
STT_OPENAI_MODEL = getattr(settings, "STT_OPENAI_MODEL", "whisper-1")
OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions"


class TranscribeRequest(BaseModel):
    """Base64-encoded 16kHz WAV audio from the client."""
    audio: str
    language: Optional[list[str]] = None  # e.g. ["en"]
    before_text: Optional[str] = None
    after_text: Optional[str] = None


class TranscribeResponse(BaseModel):
    text: str


async def _transcribe_openai(audio_b64: str, language: Optional[list[str]]) -> str:
    """Call OpenAI Whisper transcriptions API. Raises HTTPException on failure."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Voice input is not configured. Set OPENAI_API_KEY to enable.",
        )
    try:
        audio_bytes = base64.b64decode(audio_b64)
    except Exception as e:
        logger.warning("Invalid base64 audio: %s", e)
        raise HTTPException(status_code=400, detail="Invalid audio data.")
    lang = (language or ["en"])[0] if (language and len(language) > 0) else "en"
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                OPENAI_TRANSCRIPTIONS_URL,
                files={"file": ("audio.wav", audio_bytes, "audio/wav")},
                data={"model": STT_OPENAI_MODEL, "language": lang, "response_format": "text"},
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
            )
    except httpx.TimeoutException:
        logger.warning("OpenAI transcriptions timeout")
        raise HTTPException(status_code=502, detail="Voice input failed: timeout contacting STT provider.")
    except httpx.ConnectError:
        logger.warning("OpenAI transcriptions connection error")
        raise HTTPException(status_code=502, detail="Voice input failed: STT provider unreachable.")
    except Exception as e:
        logger.exception("OpenAI transcriptions error: %s", e)
        raise HTTPException(status_code=502, detail="Voice input failed: STT error. Try again or type.")
    if resp.status_code != 200:
        detail = resp.text or f"STT provider error: {resp.status_code}"
        try:
            err = resp.json()
            if isinstance(err.get("error"), dict) and err["error"].get("message"):
                detail = err["error"]["message"]
        except Exception:
            pass
        if len(detail) > 400:
            detail = detail[:397] + "..."
        logger.warning("OpenAI transcriptions error: status=%s body=%s", resp.status_code, detail)
        raise HTTPException(status_code=502, detail=detail)
    return (resp.text or "").strip()


async def _transcribe_wispr(request: TranscribeRequest) -> str:
    """Call Wispr Flow API. Raises HTTPException on failure."""
    if not settings.WISPR_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Voice input is not configured. Set WISPR_API_KEY when using Wispr.",
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
    logger.info("Calling Wispr API (audio length %d chars)", len(request.audio))
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                settings.WISPR_API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.WISPR_API_KEY}"},
            )
    except httpx.TimeoutException:
        logger.warning("Wispr API timeout")
        raise HTTPException(status_code=502, detail="Voice input failed: timeout contacting STT provider.")
    except httpx.ConnectError:
        logger.warning("Wispr API connection error")
        raise HTTPException(status_code=502, detail="Voice input failed: STT provider unreachable.")
    except Exception as e:
        logger.exception("Wispr API request failed: %s", e)
        raise HTTPException(status_code=502, detail="Voice input failed: STT error. Try again or type.")
    if resp.status_code != 200:
        detail = resp.text or f"Wispr API error: {resp.status_code}"
        try:
            err_json = resp.json()
            if isinstance(err_json, dict) and err_json.get("detail"):
                detail = err_json["detail"] if isinstance(err_json["detail"], str) else str(err_json["detail"])
        except Exception:
            pass
        if len(detail) > 400:
            detail = detail[:397] + "..."
        logger.warning("Wispr API error: status=%s body=%s", resp.status_code, detail)
        raise HTTPException(status_code=502, detail=detail)
    data = resp.json()
    return (data.get("text") or "").strip()


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(request: TranscribeRequest):
    """
    Transcribe speech to text. Uses OpenAI Whisper when STT_PROVIDER=openai (default),
    or Wispr Flow when STT_PROVIDER=wispr. Same contract: base64 16kHz WAV in, text out.
    """
    if STT_PROVIDER == "wispr":
        text = await _transcribe_wispr(request)
    else:
        text = await _transcribe_openai(request.audio, request.language)
    logger.info("Transcription succeeded (%d chars)", len(text))
    return TranscribeResponse(text=text)
