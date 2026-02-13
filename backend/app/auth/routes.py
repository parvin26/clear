"""Auth API routes: sign-up OTP, register, login, magic link."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.auth.schemas import (
    SendSignupOtpRequest,
    SendSignupOtpResponse,
    VerifySignupOtpRequest,
    VerifySignupOtpResponse,
    RegisterRequest,
    LoginRequest,
    SendMagicLinkRequest,
    SendMagicLinkResponse,
    TokenResponse,
)
from app.auth import service
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
optional_bearer = HTTPBearer(auto_error=False)


@router.post("/send-signup-otp", response_model=SendSignupOtpResponse)
async def send_signup_otp(body: SendSignupOtpRequest, db: Session = Depends(get_db)):
    """Send OTP to email for sign-up verification."""
    ok, err_msg = await service.send_signup_otp(db, body.email)
    if not ok and settings.ZEPTO_MAIL_API_KEY:
        detail = (err_msg or "Failed to send verification email. Try again shortly.")[:500]
        raise HTTPException(status_code=503, detail=detail)
    return SendSignupOtpResponse(expires_in_minutes=settings.OTP_EXPIRE_MINUTES)


@router.post("/verify-signup-otp", response_model=VerifySignupOtpResponse)
def verify_signup_otp(body: VerifySignupOtpRequest, db: Session = Depends(get_db)):
    """Verify OTP for sign-up (optional step; frontend can also send OTP with register)."""
    ok = service.verify_signup_otp(db, body.email, body.otp)
    if not ok:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")
    return VerifySignupOtpResponse()


@router.post("/register", response_model=TokenResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """Register with email + OTP + password. OTP is verified and consumed; user created; tokens returned."""
    user, reason = service.register_with_otp(db, body.email, body.otp, body.password, body.name)
    if not user:
        if reason == "already_registered":
            raise HTTPException(status_code=400, detail="This email is already registered. Sign in instead.")
        raise HTTPException(status_code=400, detail="Invalid or expired verification code. Request a new code and try again.")
    return TokenResponse(**service.tokens_for_user(user))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Sign in with email and password."""
    user = service.login(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return TokenResponse(**service.tokens_for_user(user))


@router.post("/send-magic-link", response_model=SendMagicLinkResponse)
async def send_magic_link(body: SendMagicLinkRequest, db: Session = Depends(get_db)):
    """Send magic link to email for passwordless sign-in. Does not reveal whether account exists."""
    await service.send_magic_link(db, body.email)
    return SendMagicLinkResponse(expires_in_minutes=settings.MAGIC_LINK_EXPIRE_MINUTES)


@router.get("/verify-magic-link", response_model=TokenResponse)
def verify_magic_link(token: str, email: str, db: Session = Depends(get_db)):
    """Verify magic link token and return tokens. Called by frontend after user clicks link."""
    user = service.verify_magic_link_and_get_user(db, email, token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired link.")
    return TokenResponse(**service.tokens_for_user(user))


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
):
    """Dependency: optional current user from Bearer token."""
    if not credentials:
        return None
    from app.auth.tokens import decode_token
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return None
    return service.get_user_by_id(db, user_id)


@router.get("/me")
def me(user=Depends(get_current_user_optional)):
    """Return current user if authenticated."""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return service.user_to_response(user)
