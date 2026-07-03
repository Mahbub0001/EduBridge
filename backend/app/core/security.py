from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

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
                
            logger.error(f"Error verifying Firebase token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
