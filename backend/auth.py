import os
from pathlib import Path

from dotenv import load_dotenv

from fastapi import Cookie, Depends, HTTPException
from itsdangerous import BadSignature, SignatureExpired
from sqlalchemy.orm import Session

from database import get_db
from itsdangerous import URLSafeTimedSerializer


# Load environment variables from the project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env.local")


# Session configuration
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY")

if not SESSION_SECRET_KEY:
    raise RuntimeError(
        "SESSION_SECRET_KEY was not found in the root .env.local file."
    )


SESSION_COOKIE_NAME = "portfolio_admin_session"

SESSION_MAX_AGE = 60 * 60 * 8  # 8 hours

session_serializer = URLSafeTimedSerializer(
    SESSION_SECRET_KEY,
    salt="portfolio-admin-session"
)

from pwdlib import PasswordHash

from models import AdminUser


# Password hashing configuration
password_hash = PasswordHash.recommended()


# Verify administrator credentials
def verify_admin_password(
    username: str,
    password: str,
    db
):
    admin = db.query(AdminUser).filter(
        AdminUser.username == username
    ).first()

    if admin is None or not admin.is_active:
        return None

    if not password_hash.verify(
        password,
        admin.password_hash
    ):
        return None

    return admin

# Verify administrator session
def get_current_admin(
    session_token: str | None = Cookie(
        default=None,
        alias=SESSION_COOKIE_NAME
    ),
    db: Session = Depends(get_db)
):
    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required."
        )

    try:
        session_data = session_serializer.loads(
            session_token,
            max_age=SESSION_MAX_AGE
        )

    except (BadSignature, SignatureExpired):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session."
        )

    admin_id = session_data.get("admin_id")

    if not isinstance(admin_id, int):
        raise HTTPException(
            status_code=401,
            detail="Invalid session."
        )

    admin = db.query(AdminUser).filter(
        AdminUser.id == admin_id,
        AdminUser.is_active.is_(True)
    ).first()

    if admin is None:
        raise HTTPException(
            status_code=401,
            detail="Administrator account not found or inactive."
        )

    return admin