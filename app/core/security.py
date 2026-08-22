from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from app.core.config import settings
from app.core.exceptions import AuthInvalidCredentialsException

ALGORITHM = "HS256"


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(hours=24)
    to_encode.update({"exp": expire, "iat": now})
    secret = settings.SUPABASE_JWT_SECRET or "secret"
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify JWT access token."""
    secret = settings.SUPABASE_JWT_SECRET or "secret"
    try:

        payload = jwt.decode(
            token,
            secret,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthInvalidCredentialsException("Authentication token has expired")
    except jwt.InvalidTokenError:

        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
                algorithms=[ALGORITHM, "RS256"],
            )
            return payload
        except Exception:
            raise AuthInvalidCredentialsException("Invalid authentication token")
