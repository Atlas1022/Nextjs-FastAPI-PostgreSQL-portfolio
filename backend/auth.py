import os
from pathlib import Path

from dotenv import load_dotenv


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