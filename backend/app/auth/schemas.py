"""Pydantic schemas for auth API."""
from pydantic import BaseModel, EmailStr, Field


class SendSignupOtpRequest(BaseModel):
    email: EmailStr


class SendSignupOtpResponse(BaseModel):
    message: str = "OTP sent to your email."
    expires_in_minutes: int = 15


class VerifySignupOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d+$")


class VerifySignupOtpResponse(BaseModel):
    verified: bool = True
    message: str = "Email verified. You can now set your password and complete registration."


class RegisterRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d+$")
    password: str = Field(..., min_length=8)
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SendMagicLinkRequest(BaseModel):
    email: EmailStr


class SendMagicLinkResponse(BaseModel):
    message: str = "If an account exists, you will receive a sign-in link shortly."
    expires_in_minutes: int = 15


class UserResponse(BaseModel):
    id: int
    email: str | None
    name: str | None
    email_verified_at: str | None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
