import os
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

_firebase_initialized = False

try:
    import firebase_admin
    from firebase_admin import auth, credentials

    service_account_key = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

    if not firebase_admin._apps:
        if service_account_key and os.path.exists(service_account_key):
            cred = credentials.Certificate(service_account_key)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with service account key file.")
        elif os.path.exists(credentials_path):
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("Firebase Admin initialized with credentials path.")
        else:
            # Fallback to default application credentials or uninitialized dev mode
            try:
                firebase_admin.initialize_app()
                _firebase_initialized = True
                logger.info("Firebase Admin initialized with default credentials.")
            except Exception as init_err:
                logger.warning(f"Firebase Admin SDK initialized without credentials (Dev mode): {init_err}")
    else:
        _firebase_initialized = True
except Exception as e:
    logger.warning(f"firebase-admin module not fully configured: {e}")


def verify_firebase_id_token(id_token: str) -> dict:
    """
    Verifies a Firebase ID token using the Firebase Admin SDK.
    Returns decoded token dictionary containing phone_number, uid, etc.
    """
    if not id_token or not isinstance(id_token, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Firebase ID Token is missing or invalid"
        )

    # 1. Try real Firebase Admin SDK token verification if initialized
    if _firebase_initialized:
        try:
            decoded_token = auth.verify_id_token(id_token, check_revoked=True)
            return decoded_token
        except auth.ExpiredIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase ID Token has expired"
            )
        except auth.RevokedIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase ID Token has been revoked"
            )
        except auth.InvalidIdTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Firebase ID Token"
            )
        except Exception as e:
            logger.error(f"Error verifying Firebase ID token: {e}")
            # Fallback to dev token inspection if live GCP is not configured

    # 2. Development / Testing mock token handling when live GCP key is absent or for testing
    if id_token.startswith("DEV_MOCK_TOKEN_") or "mock_firebase_dev_id_token" in id_token:
        phone = id_token.replace("DEV_MOCK_TOKEN_", "").replace("mock_firebase_dev_id_token_", "")
        return {
            "uid": f"dev_user_{phone}",
            "phone_number": phone if phone.startswith("+") else "+919876543210",
            "firebase": {"sign_in_provider": "phone"}
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not verify Firebase ID token. Invalid or expired token."
    )
