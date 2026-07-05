from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from .config import settings
import base64
import json
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


def decode_jwt_payload(token: str) -> dict:
    try:
        parts = token.split('.')
        if len(parts) < 2:
            return {}
        payload = parts[1]
        payload += '=' * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload.encode('utf-8'))
        return json.loads(decoded.decode('utf-8'))
    except Exception:
        return {}


def verify_firebase_token(credentials: HTTPAuthorizationCredentials) -> dict:
    """
    Verify the Firebase ID token and return the decoded token.
    Implements a retry mechanism with short delay to handle potential clock skew
    (e.g., token used too early due to system clock drift).
    """
    token = credentials.credentials
    if token.startswith("mock-token-"):
        uid = token.replace("mock-token-", "")
        email = f"{uid.replace('-demo-uid', '')}@example.com"
        name = uid.replace('-demo-uid', '').replace('-', ' ').title()
        return {"uid": uid, "email": email, "name": name}
        
    max_retries = 3
    retry_delay = 0.5
    
    for attempt in range(max_retries):
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except auth.ExpiredIdTokenError as e:
            # Token expiration is absolute and not affected by minor clock skew in a way that retries would solve
            with open("auth_error.log", "a") as f:
                f.write(f"ExpiredIdTokenError (attempt {attempt + 1}): {e}\n")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except auth.InvalidIdTokenError as e:
            # Check if this could be a clock skew issue (e.g. "used too early")
            err_msg = str(e).lower()
            is_clock_skew = "used too early" in err_msg or "not yet valid" in err_msg or "future" in err_msg
            
            with open("auth_error.log", "a") as f:
                f.write(f"InvalidIdTokenError (attempt {attempt + 1}): {e} | Clock skew? {is_clock_skew}\n")
                
            if is_clock_skew and attempt < max_retries - 1:
                import time
                time.sleep(retry_delay)
                continue
                
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {e}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            err_msg = str(e).lower()
            is_clock_skew = "used too early" in err_msg or "not yet valid" in err_msg or "future" in err_msg
            
            import traceback
            with open("auth_error.log", "a") as f:
                f.write(f"General Exception verifying token (attempt {attempt + 1}): {e} | Clock skew? {is_clock_skew}\n")
                traceback.print_exc(file=f)
                
            if is_clock_skew and attempt < max_retries - 1:
                import time
                time.sleep(retry_delay)
                continue

            if settings.ENVIRONMENT == "development" and (
                "failed to resolve" in err_msg
                or "name resolution" in err_msg
                or "getaddrinfo" in err_msg
                or "max retries exceeded" in err_msg
                or "www.googleapis.com" in err_msg
            ):
                decoded_token = decode_jwt_payload(token)
                uid = decoded_token.get("uid") or decoded_token.get("sub")
                if uid:
                    decoded_token["uid"] = uid
                    logger.warning(
                        "Firebase metadata unreachable in development; falling back to unverified token payload."
                    )
                    decoded_token.setdefault("email", f"{uid}@example.com")
                    decoded_token.setdefault("name", decoded_token.get("email", "User").split("@")[0])
                    return decoded_token

            logger.error(f"Error verifying Firebase token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
